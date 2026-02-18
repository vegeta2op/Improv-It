import asyncio
import csv
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import AsyncSessionLocal, Student, init_db


async def migrate_students_from_csv(csv_file: str = "data.csv"):
    """Migrate students from CSV to PostgreSQL"""

    print("Initializing database...")
    await init_db()

    # Check if students already exist
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Student))
        existing = result.scalars().all()

        if existing:
            print(f"Database already has {len(existing)} students. Skipping migration.")
            print("To re-migrate, clear the database first.")
            return

    # Read CSV
    print(f"Reading from {csv_file}...")

    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found!")
        return

    students_to_add = []

    with open(csv_file, "r") as f:
        reader = csv.DictReader(f)

        for row in reader:
            student = Student(
                usn=row.get("USN", "").strip(),
                name=row.get("Name", "").strip(),
                sem1=float(row.get("sem1", 0) or 0),
                sem2=float(row.get("sem2", 0) or 0),
                sem3=float(row.get("sem3", 0) or 0),
                sem4=float(row.get("sem4", 0) or 0),
                sem5=float(row.get("sem5", 0) or 0),
                sem6=float(row.get("sem6", 0) or 0),
            )
            students_to_add.append(student)

    print(f"Found {len(students_to_add)} students to migrate")

    # Insert into database
    async with AsyncSessionLocal() as session:
        session.add_all(students_to_add)
        await session.commit()

    print(f"Successfully migrated {len(students_to_add)} students!")

    # Verify
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Student))
        count = len(result.scalars().all())
        print(f"Total students in database: {count}")


async def clear_students():
    """Clear all students from database"""
    await init_db()

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Student))
        students = result.scalars().all()

        for student in students:
            await session.delete(student)

        await session.commit()

    print(f"Deleted {len(students)} students")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Migrate student data from CSV to PostgreSQL"
    )
    parser.add_argument(
        "--clear", action="store_true", help="Clear existing students first"
    )
    parser.add_argument("--csv", default="data.csv", help="CSV file path")

    args = parser.parse_args()

    if args.clear:
        asyncio.run(clear_students())

    asyncio.run(migrate_students_from_csv(args.csv))
