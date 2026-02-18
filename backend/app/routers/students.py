from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from datetime import datetime

from app.database import get_db, Student, User
from app.schemas.schemas import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentListResponse,
    StudentMarksUpdate,
    NoteUpdate,
    NoteResponse,
)
from app.routers.auth import get_current_user

router = APIRouter()


# ── Static routes MUST come before /{usn} to avoid path conflicts ──────────

@router.get("/count", status_code=200)
async def get_student_count(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get total number of students"""
    result = await db.execute(select(func.count(Student.id)))
    count = result.scalar()
    return {"total": count}


@router.get("/export/csv", status_code=200)
async def export_students_csv(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Export all students as CSV"""
    result = await db.execute(select(Student))
    students = result.scalars().all()

    # Create CSV
    csv_lines = ["USN,Name,Sem1,Sem2,Sem3,Sem4,Sem5,Sem6"]
    for s in students:
        csv_lines.append(
            f"{s.usn},{s.name},{s.sem1},{s.sem2},{s.sem3},{s.sem4},{s.sem5},{s.sem6}"
        )

    csv_data = "\n".join(csv_lines)

    return {
        "success": True,
        "data": csv_data,
        "filename": f"students_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
        "content_type": "text/csv",
    }


@router.post(
    "/bulk", response_model=List[StudentResponse], status_code=status.HTTP_201_CREATED
)
async def create_students_bulk(
    students: List[StudentCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create multiple students at once"""
    if len(students) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create more than 100 students at once",
        )

    db_students = []
    for student in students:
        # Check if USN exists
        result = await db.execute(select(Student).where(Student.usn == student.usn))
        existing = result.scalar_one_or_none()

        if not existing:
            db_student = Student(
                usn=student.usn,
                name=student.name,
                sem1=student.sem1,
                sem2=student.sem2,
                sem3=student.sem3,
                sem4=student.sem4,
                sem5=student.sem5,
                sem6=student.sem6,
                created_by=current_user.id,
            )
            db_students.append(db_student)

    if db_students:
        db.add_all(db_students)
        await db.commit()
        # Refresh each student to populate generated fields
        for s in db_students:
            await db.refresh(s)

    return db_students


@router.patch("/marks", response_model=StudentResponse)
async def update_student_marks(
    marks_update: StudentMarksUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update student marks"""
    result = await db.execute(select(Student).where(Student.usn == marks_update.usn))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    # Update marks
    if marks_update.sem1 is not None:
        student.sem1 = marks_update.sem1
    if marks_update.sem2 is not None:
        student.sem2 = marks_update.sem2
    if marks_update.sem3 is not None:
        student.sem3 = marks_update.sem3
    if marks_update.sem4 is not None:
        student.sem4 = marks_update.sem4
    if marks_update.sem5 is not None:
        student.sem5 = marks_update.sem5

    student.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(student)

    return student


# ── Collection route ────────────────────────────────────────────────────────

@router.get("", response_model=List[StudentListResponse])
async def get_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: str = Query("usn", pattern=r"^(usn|name|sem6|created_at)$"),
    sort_order: str = Query("asc", pattern=r"^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of students with pagination and filtering"""
    query = select(Student)

    # Search
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(Student.usn.ilike(search_term), Student.name.ilike(search_term))
        )

    # Sort
    sort_column = getattr(Student, sort_by, Student.usn)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Pagination
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    students = result.scalars().all()

    return students


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new student"""
    # Check if USN already exists
    result = await db.execute(select(Student).where(Student.usn == student.usn))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="USN already exists"
        )

    db_student = Student(
        usn=student.usn,
        name=student.name,
        sem1=student.sem1,
        sem2=student.sem2,
        sem3=student.sem3,
        sem4=student.sem4,
        sem5=student.sem5,
        sem6=student.sem6,
        created_by=current_user.id,
    )

    db.add(db_student)
    await db.commit()
    await db.refresh(db_student)

    return db_student


# ── Per-student routes (/{usn} LAST to avoid swallowing static paths) ───────

@router.get("/{usn}", response_model=StudentResponse)
async def get_student(
    usn: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get student by USN"""
    result = await db.execute(select(Student).where(Student.usn == usn))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    return student


@router.put("/{usn}", response_model=StudentResponse)
async def update_student(
    usn: str,
    student_update: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update student details"""
    result = await db.execute(select(Student).where(Student.usn == usn))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    # Update fields
    update_data = student_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    student.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(student)

    return student


@router.delete("/{usn}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    usn: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a student"""
    result = await db.execute(select(Student).where(Student.usn == usn))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    await db.delete(student)
    await db.commit()

    return None
