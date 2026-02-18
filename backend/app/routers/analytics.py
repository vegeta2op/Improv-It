from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db, Student, User
from app.schemas.schemas import AnalyticsResponse, PerformanceDistribution
from app.routers.auth import get_current_user
from app.services.cache import cache_get, cache_set, CacheKeys

router = APIRouter()


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get comprehensive analytics for the dashboard"""
    # Try cache first
    cached = await cache_get(CacheKeys.ANALYTICS)
    if cached:
        return cached

    # Get total students
    result = await db.execute(select(func.count(Student.id)))
    total_students = result.scalar() or 0

    if total_students == 0:
        return AnalyticsResponse(
            total_students=0,
            average_performance=0,
            top_performers=[],
            semester_averages={},
            performance_distribution={},
            improvement_trends=[],
        )

    # Get average performance
    result = await db.execute(
        select(
            (
                func.avg(Student.sem1)
                + func.avg(Student.sem2)
                + func.avg(Student.sem3)
                + func.avg(Student.sem4)
                + func.avg(Student.sem5)
                + func.avg(Student.sem6)
            )
            / 6
        )
    )
    avg_perf = result.scalar() or 0

    # Get semester averages
    result = await db.execute(
        select(
            func.avg(Student.sem1),
            func.avg(Student.sem2),
            func.avg(Student.sem3),
            func.avg(Student.sem4),
            func.avg(Student.sem5),
            func.avg(Student.sem6),
        )
    )
    sem_avgs = result.one()
    semester_averages = {
        "sem1": round(sem_avgs[0] or 0, 2),
        "sem2": round(sem_avgs[1] or 0, 2),
        "sem3": round(sem_avgs[2] or 0, 2),
        "sem4": round(sem_avgs[3] or 0, 2),
        "sem5": round(sem_avgs[4] or 0, 2),
        "sem6": round(sem_avgs[5] or 0, 2),
    }

    # Get top performers
    result = await db.execute(select(Student).order_by(Student.sem6.desc()).limit(5))
    top_performers = [
        {"name": s.name, "usn": s.usn, "grade": s.sem6} for s in result.scalars().all()
    ]

    # Performance distribution
    result = await db.execute(select(Student.sem6))
    all_grades = [r[0] for r in result.all()]

    excellent = sum(1 for g in all_grades if g >= 90)
    good = sum(1 for g in all_grades if 80 <= g < 90)
    average = sum(1 for g in all_grades if 70 <= g < 80)
    below_average = sum(1 for g in all_grades if g < 70)

    performance_distribution = {
        "excellent": excellent,
        "good": good,
        "average": average,
        "below_average": below_average,
    }

    # Improvement trends
    result = await db.execute(select(Student))
    improvement_trends = []
    for s in result.scalars().all():
        improvement_trends.append(
            {"name": s.name, "usn": s.usn, "trend": round(s.sem6 - s.sem1, 2)}
        )

    # Sort by improvement
    improvement_trends.sort(key=lambda x: x["trend"], reverse=True)
    improvement_trends = improvement_trends[:10]  # Top 10

    analytics = AnalyticsResponse(
        total_students=total_students,
        average_performance=round(avg_perf, 2),
        top_performers=top_performers,
        semester_averages=semester_averages,
        performance_distribution=performance_distribution,
        improvement_trends=improvement_trends,
    )

    # Cache for 5 minutes
    await cache_set(CacheKeys.ANALYTICS, analytics.model_dump(), expire=300)

    return analytics


@router.get("/distribution", response_model=PerformanceDistribution)
async def get_performance_distribution(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get grade distribution"""
    result = await db.execute(select(Student.sem6))
    all_grades = [r[0] for r in result.all()]

    return PerformanceDistribution(
        excellent=sum(1 for g in all_grades if g >= 90),
        good=sum(1 for g in all_grades if 80 <= g < 90),
        average=sum(1 for g in all_grades if 70 <= g < 80),
        below_average=sum(1 for g in all_grades if g < 70),
    )


@router.get("/semester-averages")
async def get_semester_averages(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get average grades per semester"""
    result = await db.execute(
        select(
            func.avg(Student.sem1),
            func.avg(Student.sem2),
            func.avg(Student.sem3),
            func.avg(Student.sem4),
            func.avg(Student.sem5),
            func.avg(Student.sem6),
        )
    )
    sem_avgs = result.one()

    return {
        "sem1": round(sem_avgs[0] or 0, 2),
        "sem2": round(sem_avgs[1] or 0, 2),
        "sem3": round(sem_avgs[2] or 0, 2),
        "sem4": round(sem_avgs[3] or 0, 2),
        "sem5": round(sem_avgs[4] or 0, 2),
        "sem6": round(sem_avgs[5] or 0, 2),
    }


@router.get("/top-performers")
async def get_top_performers(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get top performing students"""
    result = await db.execute(
        select(Student).order_by(Student.sem6.desc()).limit(limit)
    )

    return [
        {"usn": s.usn, "name": s.name, "grade": s.sem6} for s in result.scalars().all()
    ]


@router.get("/needs-attention")
async def get_students_needing_attention(
    threshold: float = Query(60, ge=0, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get students with grades below threshold"""
    result = await db.execute(
        select(Student).where(Student.sem6 < threshold).order_by(Student.sem6.asc())
    )

    return [
        {"usn": s.usn, "name": s.name, "grade": s.sem6} for s in result.scalars().all()
    ]


@router.get("/most-improved")
async def get_most_improved(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get students with most improvement"""
    result = await db.execute(select(Student))
    students = result.scalars().all()

    improvements = [
        {
            "usn": s.usn,
            "name": s.name,
            "sem1": s.sem1,
            "sem6": s.sem6,
            "improvement": round(s.sem6 - s.sem1, 2),
        }
        for s in students
    ]

    improvements.sort(key=lambda x: x["improvement"], reverse=True)
    return improvements[:limit]
