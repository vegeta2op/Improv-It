from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_db, Student, UserNote, User
from app.schemas.schemas import NoteUpdate, NoteResponse
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/stats", status_code=200)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics"""
    # Get total students
    result = await db.execute(select(Student))
    students = result.scalars().all()
    total = len(students)

    if total == 0:
        return {
            "total_students": 0,
            "average_performance": 0,
            "top_performers": 0,
            "needs_attention": 0,
        }

    # Average performance
    avg_perf = sum(s.sem6 for s in students) / total

    # Top performers (>= 90)
    top = sum(1 for s in students if s.sem6 >= 90)

    # Needs attention (< 60)
    needs_attention = sum(1 for s in students if s.sem6 < 60)

    return {
        "total_students": total,
        "average_performance": round(avg_perf, 2),
        "top_performers": top,
        "needs_attention": needs_attention,
    }


@router.get("/notifications", status_code=200)
async def get_notifications(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get user notifications"""
    notifications = []

    # Get students needing attention
    result = await db.execute(select(Student).where(Student.sem6 < 60))
    low_performers = result.scalars().all()

    if low_performers:
        notifications.append(
            {
                "type": "warning",
                "title": "Students Need Attention",
                "message": f"{len(low_performers)} students have grades below 60%",
                "timestamp": datetime.utcnow().isoformat(),
                "action_url": "/students?filter=low_performance",
            }
        )

    # Check for excellent performers
    result = await db.execute(select(Student).where(Student.sem6 >= 90))
    excellent = result.scalars().all()

    if excellent:
        notifications.append(
            {
                "type": "success",
                "title": "Excellent Performance",
                "message": f"{len(excellent)} students achieved excellent grades!",
                "timestamp": datetime.utcnow().isoformat(),
                "action_url": "/students?filter=excellent",
            }
        )

    # System notification
    notifications.append(
        {
            "type": "info",
            "title": "System Update Available",
            "message": "New features and improvements are available",
            "timestamp": datetime.utcnow().isoformat(),
            "action_url": "#",
        }
    )

    return {
        "notifications": notifications,
        "unread_count": len(
            [n for n in notifications if n["type"] in ["warning", "error"]]
        ),
    }


@router.get("/notes", response_model=NoteResponse)
async def get_notes(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get user notes"""
    result = await db.execute(
        select(UserNote).where(UserNote.user_id == current_user.id)
    )
    notes = result.scalars().all()

    notes_dict = {
        "note1": "To Do List",
        "note2": "To Do List",
        "note3": "To Do List",
        "note4": "To Do List",
    }

    for note in notes:
        notes_dict[note.note_id] = note.content

    return NoteResponse(**notes_dict)


@router.put("/notes", status_code=200)
async def update_note(
    note: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a user note"""
    # Check if note exists
    result = await db.execute(
        select(UserNote).where(
            UserNote.user_id == current_user.id, UserNote.note_id == note.note_id
        )
    )
    existing_note = result.scalar_one_or_none()

    if existing_note:
        existing_note.content = note.content
        existing_note.updated_at = datetime.utcnow()
    else:
        new_note = UserNote(
            user_id=current_user.id, note_id=note.note_id, content=note.content
        )
        db.add(new_note)

    await db.commit()

    return {"success": True, "message": "Note saved successfully"}


@router.get("/recent-students", status_code=200)
async def get_recent_students(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recently added/updated students"""
    result = await db.execute(
        select(Student).order_by(Student.updated_at.desc()).limit(limit)
    )
    students = result.scalars().all()

    return [
        {
            "usn": s.usn,
            "name": s.name,
            "sem6": s.sem6,
            "trend": round(s.sem6 - s.sem1, 2),
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in students
    ]


@router.get("/performance-chart/{usn}", status_code=200)
async def get_performance_chart(
    usn: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get performance chart data for a student"""
    result = await db.execute(select(Student).where(Student.usn == usn))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    return {
        "labels": ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"],
        "grades": [
            student.sem1,
            student.sem2,
            student.sem3,
            student.sem4,
            student.sem5,
            student.sem6,
        ],
        "name": student.name,
        "usn": student.usn,
    }


@router.get("/system-health", status_code=200)
async def get_system_health(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get system health metrics"""
    try:
        import psutil

        cpu = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        result = await db.execute(select(Student))
        students = result.scalars().all()

        alerts = []
        if cpu > 80:
            alerts.append({"type": "warning", "message": f"High CPU usage: {cpu}%"})
        if memory.percent > 85:
            alerts.append(
                {"type": "warning", "message": f"High memory usage: {memory.percent}%"}
            )
        if disk.percent > 90:
            alerts.append(
                {"type": "error", "message": f"Low disk space: {disk.percent}%"}
            )

        return {
            "success": True,
            "health": {
                "system": {
                    "cpu_usage": cpu,
                    "memory_usage": memory.percent,
                    "memory_available": memory.available // (1024 * 1024),
                    "disk_usage": disk.percent,
                    "disk_free": disk.free // (1024 * 1024 * 1024),
                    "uptime": "Online",
                },
                "application": {
                    "total_students": len(students),
                    "models_status": "Active",
                    "last_update": datetime.utcnow().isoformat(),
                    "data_integrity": "Good" if len(students) > 0 else "Warning",
                },
                "alerts": alerts,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    except ImportError:
        result = await db.execute(select(Student))
        students = result.scalars().all()

        return {
            "success": True,
            "health": {
                "system": {"status": "Monitoring unavailable"},
                "application": {"total_students": len(students), "status": "Running"},
                "alerts": [],
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
