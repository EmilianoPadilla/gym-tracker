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

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Exercises (routine) ----
class ExerciseCreate(BaseModel):
    name: str
    day_of_week: int  # 0=Monday ... 6=Sunday
    order_index: int = 0


class ExerciseOut(BaseModel):
    id: int
    name: str
    day_of_week: int
    order_index: int

    class Config:
        from_attributes = True


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
    latest_weight: Optional[float] = None
    latest_date: Optional[date] = None
    streak: int = 0  # consecutive sessions at the same weight
    history: List[LogOut] = []
