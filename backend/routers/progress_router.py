from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])

DEFAULT_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


@router.get("", response_model=schemas.ProgressResponse)
def get_progress(
    day_of_week: int,
    days_back: int = 90,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Every exercise assigned to one weekday (e.g. everything on your 'Push day'),
    each with its own weight history over the given range - the data behind the
    multi-line progress chart, one line per exercise.
    """
    if not 0 <= day_of_week <= 6:
        raise HTTPException(status_code=400, detail="day_of_week must be 0 (Monday) to 6 (Sunday)")

    label_row = (
        db.query(models.DayLabel)
        .filter(models.DayLabel.user_id == current_user.id, models.DayLabel.day_of_week == day_of_week)
        .first()
    )
    label = label_row.label if label_row else DEFAULT_DAY_NAMES[day_of_week]

    exercises = (
        db.query(models.Exercise)
        .filter(models.Exercise.user_id == current_user.id, models.Exercise.day_of_week == day_of_week)
        .order_by(models.Exercise.order_index)
        .all()
    )

    cutoff = date.today() - timedelta(days=days_back)
    result_exercises = []
    for ex in exercises:
        logs = (
            db.query(models.Log)
            .filter(models.Log.exercise_id == ex.id, models.Log.date >= cutoff)
            .order_by(models.Log.date.asc())
            .all()
        )
        result_exercises.append(
            schemas.ProgressExercise(
                id=ex.id,
                name=ex.name,
                history=[schemas.ProgressPoint(date=log.date, weight=log.weight) for log in logs],
            )
        )

    return schemas.ProgressResponse(day_of_week=day_of_week, label=label, exercises=result_exercises)
