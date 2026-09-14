from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import relationship
from database import Base


class DayLabel(Base):
    """A custom name a user gives one of their weekdays, e.g. 'Push day'."""
    __tablename__ = "day_labels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday ... 6=Sunday
    label = Column(String, nullable=False)

    owner = relationship("User", back_populates="day_labels")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # null for Google-only accounts
    name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    profile_picture = Column(Text, nullable=True)  # base64 data URL, resized client-side
    google_id = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    exercises = relationship("Exercise", back_populates="owner", cascade="all, delete-orphan")
    body_metrics = relationship("BodyMetric", back_populates="owner", cascade="all, delete-orphan")
    day_labels = relationship("DayLabel", back_populates="owner", cascade="all, delete-orphan")


class Exercise(Base):
    """A row in the user's routine: e.g. 'Incline Chest Press' on Monday (day_of_week=0)."""
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday ... 6=Sunday
    order_index = Column(Integer, default=0)
    preferred_unit = Column(String, default="kg", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="exercises")
    logs = relationship("Log", back_populates="exercise", cascade="all, delete-orphan")


class Log(Base):
    """A single weight entry for an exercise on a given date."""
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    date = Column(Date, nullable=False)
    weight = Column(Float, nullable=False)
    reps = Column(Integer, nullable=True)
    sets = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    exercise = relationship("Exercise", back_populates="logs")


class BodyMetric(Base):
    """A single body-composition reading (e.g. from a smart scale) for one date."""
    __tablename__ = "body_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    weight = Column(Float, nullable=True)
    muscle_mass = Column(Float, nullable=True)
    fat_percentage = Column(Float, nullable=True)
    visceral_fat = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="body_metrics")
