from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ---- Auth ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    last_name: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    last_name: str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    profile_picture: Optional[str] = None
    name: Optional[str] = None
    last_name: Optional[str] = None


class GoogleLogin(BaseModel):
    credential: str  # the ID token from Google Identity Services


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Exercises (routine) ----
class ExerciseCreate(BaseModel):
    name: str
    day_of_week: int  # 0=Monday ... 6=Sunday
    order_index: int = 0
    preferred_unit: str = "kg"


class ExerciseOut(BaseModel):
    id: int
    name: str
    day_of_week: int
    order_index: int
    preferred_unit: str

    class Config:
        from_attributes = True


class ExerciseReorder(BaseModel):
    order_index: int


class ExerciseUnitUpdate(BaseModel):
    preferred_unit: str


# ---- Logs ----
class LogCreate(BaseModel):
    weight: float
    reps: Optional[int] = None
    sets: Optional[int] = None
    log_date: Optional[date] = None  # defaults to today server-side if omitted


class LogOut(BaseModel):
    id: int
    date: date
    weight: float
    reps: Optional[int]
    sets: Optional[int]

    class Config:
        from_attributes = True


# ---- Composite response: today's exercise + streak + history ----
class ExerciseWithStreak(BaseModel):
    id: int
    name: str
    day_of_week: int
    order_index: int
    preferred_unit: str = "kg"
    latest_weight: Optional[float] = None
    latest_date: Optional[date] = None
    streak: int = 0  # consecutive sessions at the same weight
    history: List[LogOut] = []


# ---- Body metrics (smart scale readings) ----
class BodyMetricCreate(BaseModel):
    weight: Optional[float] = None
    muscle_mass: Optional[float] = None
    fat_percentage: Optional[float] = None
    visceral_fat: Optional[float] = None
    metric_date: Optional[date] = None  # defaults to today if omitted


class BodyMetricOut(BaseModel):
    id: int
    date: date
    weight: Optional[float]
    muscle_mass: Optional[float]
    fat_percentage: Optional[float]
    visceral_fat: Optional[float]

    class Config:
        from_attributes = True
