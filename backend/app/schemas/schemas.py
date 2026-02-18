from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Annotated
from datetime import datetime


# ==================== User Schemas ====================
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== Student Schemas ====================
class StudentBase(BaseModel):
    usn: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    sem1: float = Field(..., ge=0, le=100)
    sem2: float = Field(..., ge=0, le=100)
    sem3: float = Field(..., ge=0, le=100)
    sem4: float = Field(..., ge=0, le=100)
    sem5: float = Field(..., ge=0, le=100)
    sem6: float = Field(..., ge=0, le=100)


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    usn: Optional[str] = Field(None, min_length=1, max_length=20)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sem1: Optional[float] = Field(None, ge=0, le=100)
    sem2: Optional[float] = Field(None, ge=0, le=100)
    sem3: Optional[float] = Field(None, ge=0, le=100)
    sem4: Optional[float] = Field(None, ge=0, le=100)
    sem5: Optional[float] = Field(None, ge=0, le=100)
    sem6: Optional[float] = Field(None, ge=0, le=100)


class StudentMarksUpdate(BaseModel):
    usn: str
    sem1: Optional[float] = Field(None, ge=0, le=100)
    sem2: Optional[float] = Field(None, ge=0, le=100)
    sem3: Optional[float] = Field(None, ge=0, le=100)
    sem4: Optional[float] = Field(None, ge=0, le=100)
    sem5: Optional[float] = Field(None, ge=0, le=100)


class StudentResponse(StudentBase):
    id: int
    predicted_sem7: Optional[float] = None
    prediction_confidence: Optional[float] = None
    last_prediction_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StudentListResponse(BaseModel):
    id: int
    usn: str
    name: str
    sem6: float
    predicted_sem7: Optional[float] = None
    prediction_confidence: Optional[float] = None

    model_config = {"from_attributes": True}


# ==================== Analytics Schemas ====================
class AnalyticsResponse(BaseModel):
    total_students: int
    average_performance: float
    top_performers: List[dict]
    semester_averages: dict
    performance_distribution: dict
    improvement_trends: List[dict]


class PerformanceDistribution(BaseModel):
    excellent: int  # >= 90
    good: int  # 80-89
    average: int  # 70-79
    below_average: int  # < 70


class StudentInsights(BaseModel):
    student_id: int
    usn: str
    name: str
    current_grade: float
    predicted_next_semester: float
    confidence: float
    trend: str  # improving, declining, stable
    recommendations: List[str]


# ==================== Prediction Schemas ====================
class PredictionRequest(BaseModel):
    usn: str


class BatchPredictionRequest(BaseModel):
    # Annotated list with max 100 items (Pydantic v2 style)
    usns: Annotated[List[str], Field(max_length=100)]


class PredictionResponse(BaseModel):
    usn: str
    name: str
    predicted_grade: float
    confidence: float
    model_used: str
    factors: List[str]


class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    total: int
    timestamp: datetime


# ==================== Notes Schemas ====================
class NoteUpdate(BaseModel):
    note_id: str = Field(..., pattern=r"^note[1-4]$")
    content: str = Field(..., max_length=500)


class NoteResponse(BaseModel):
    note1: str = "To Do List"
    note2: str = "To Do List"
    note3: str = "To Do List"
    note4: str = "To Do List"


# ==================== Health Check ====================
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str = "3.0.0"


# ==================== Export Schemas ====================
class ExportRequest(BaseModel):
    format: str = Field(default="csv", pattern=r"^(csv|json)$")


class ExportResponse(BaseModel):
    success: bool
    data: str
    filename: str
    content_type: str
