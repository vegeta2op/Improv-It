from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import httpx

from app.database import get_db, Student, User
from app.schemas.schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    StudentInsights,
)
from app.routers.auth import get_current_user
from app.config import settings

router = APIRouter()


async def call_ml_service(endpoint: str, payload: dict) -> dict:
    """Call BentoML prediction service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ML_SERVICE_URL}{endpoint}", json=payload, timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML service unavailable: {str(e)}",
        )


@router.post("/single", response_model=PredictionResponse)
async def predict_single_student(
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prediction for a single student"""
    # Get student
    result = await db.execute(select(Student).where(Student.usn == request.usn))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    # Prepare data for ML
    student_data = {
        "usn": student.usn,
        "name": student.name,
        "sem1": student.sem1,
        "sem2": student.sem2,
        "sem3": student.sem3,
        "sem4": student.sem4,
        "sem5": student.sem5,
        "sem6": student.sem6,
    }

    try:
        # Call ML service
        ml_response = await call_ml_service("/predict", student_data)

        # Update student with prediction
        student.predicted_sem7 = ml_response.get("predicted_grade")
        student.prediction_confidence = ml_response.get("confidence")
        student.last_prediction_at = datetime.utcnow()
        await db.commit()

        return PredictionResponse(
            usn=student.usn,
            name=student.name,
            predicted_grade=ml_response.get("predicted_grade", 0),
            confidence=ml_response.get("confidence", 0),
            model_used=ml_response.get("model_used", "ensemble"),
            factors=ml_response.get("factors", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        # Fallback: simple average prediction
        avg = (
            student.sem1
            + student.sem2
            + student.sem3
            + student.sem4
            + student.sem5
            + student.sem6
        ) / 6
        predicted = min(100, max(0, avg + (student.sem6 - student.sem1) / 6))

        student.predicted_sem7 = predicted
        student.prediction_confidence = 0.5
        student.last_prediction_at = datetime.utcnow()
        await db.commit()

        return PredictionResponse(
            usn=student.usn,
            name=student.name,
            predicted_grade=round(predicted, 2),
            confidence=0.5,
            model_used="fallback",
            factors=["Based on historical average"],
        )


@router.post("/batch", response_model=BatchPredictionResponse)
async def predict_batch_students(
    request: BatchPredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get predictions for multiple students"""
    students_data = []

    for usn in request.usns:
        result = await db.execute(select(Student).where(Student.usn == usn))
        student = result.scalar_one_or_none()

        if student:
            students_data.append(
                {
                    "usn": student.usn,
                    "name": student.name,
                    "sem1": student.sem1,
                    "sem2": student.sem2,
                    "sem3": student.sem3,
                    "sem4": student.sem4,
                    "sem5": student.sem5,
                    "sem6": student.sem6,
                }
            )

    if not students_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No students found"
        )

    try:
        # Call ML service
        ml_response = await call_ml_service(
            "/predict/batch", {"students": students_data}
        )

        predictions = []
        for pred in ml_response.get("predictions", []):
            # Update student record
            result = await db.execute(select(Student).where(Student.usn == pred["usn"]))
            student = result.scalar_one_or_none()

            if student:
                student.predicted_sem7 = pred.get("predicted_grade")
                student.prediction_confidence = pred.get("confidence")
                student.last_prediction_at = datetime.utcnow()

            predictions.append(
                PredictionResponse(
                    usn=pred.get("usn", ""),
                    name=pred.get("name", ""),
                    predicted_grade=pred.get("predicted_grade", 0),
                    confidence=pred.get("confidence", 0),
                    model_used=pred.get("model_used", "ensemble"),
                    factors=pred.get("factors", []),
                )
            )

        await db.commit()

        return BatchPredictionResponse(
            predictions=predictions, total=len(predictions), timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception:
        # Fallback predictions
        predictions = []
        for data in students_data:
            avg = (
                data["sem1"]
                + data["sem2"]
                + data["sem3"]
                + data["sem4"]
                + data["sem5"]
                + data["sem6"]
            ) / 6
            predicted = min(100, max(0, avg + (data["sem6"] - data["sem1"]) / 6))

            result = await db.execute(select(Student).where(Student.usn == data["usn"]))
            student = result.scalar_one_or_none()

            if student:
                student.predicted_sem7 = predicted
                student.prediction_confidence = 0.5
                student.last_prediction_at = datetime.utcnow()

            predictions.append(
                PredictionResponse(
                    usn=data["usn"],
                    name=data["name"],
                    predicted_grade=round(predicted, 2),
                    confidence=0.5,
                    model_used="fallback",
                    factors=["Based on historical average"],
                )
            )

        await db.commit()

        return BatchPredictionResponse(
            predictions=predictions, total=len(predictions), timestamp=datetime.utcnow()
        )


@router.get("/{usn}/insights", response_model=StudentInsights)
async def get_student_insights(
    usn: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-powered insights for a student"""
    result = await db.execute(select(Student).where(Student.usn == usn))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    # Calculate trend
    improvement = student.sem6 - student.sem1
    if improvement > 5:
        trend = "improving"
    elif improvement < -5:
        trend = "declining"
    else:
        trend = "stable"

    # Generate recommendations
    recommendations = []

    if student.sem6 < 60:
        recommendations.append("Focus on improving fundamental concepts")
        recommendations.append("Consider additional tutoring sessions")
    elif student.sem6 < 75:
        recommendations.append("Practice more problem-solving exercises")
        recommendations.append("Review weak areas identified in assessments")
    elif student.sem6 >= 85:
        recommendations.append("Challenge yourself with advanced topics")
        recommendations.append("Consider mentoring other students")
    else:
        recommendations.append("Maintain consistent study schedule")
        recommendations.append("Focus on exam preparation strategies")

    # Check for specific subject weaknesses
    sems = [
        student.sem1,
        student.sem2,
        student.sem3,
        student.sem4,
        student.sem5,
        student.sem6,
    ]
    if min(sems) < 60:
        weakest_idx = sems.index(min(sems))
        recommendations.append(f"Focus on Semester {weakest_idx + 1} subjects")

    return StudentInsights(
        student_id=student.id,
        usn=student.usn,
        name=student.name,
        current_grade=student.sem6,
        predicted_next_semester=student.predicted_sem7 or 0,
        confidence=student.prediction_confidence or 0,
        trend=trend,
        recommendations=recommendations,
    )


@router.post("/retrain", status_code=200)
async def retrain_models(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Trigger model retraining"""
    try:
        ml_response = await call_ml_service("/retrain", {})
        return {
            "success": True,
            "message": "Models retrained successfully",
            "details": ml_response,
        }
    except HTTPException:
        raise
    except Exception:
        return {"success": False, "message": "ML service unavailable for retraining"}
