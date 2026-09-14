from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user
from crud import calculate_streak

router = APIRouter(tags=["logs"])


@router.post("/exercises/{exercise_id}/logs", response_model=schemas.LogOut)
def add_log(
    exercise_id: int,
    log: schemas.LogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    exercise = (
        db.query(models.Exercise)
        .filter(models.Exercise.id == exercise_id, models.Exercise.user_id == current_user.id)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    new_log = models.Log(
        exercise_id=exercise_id,
        date=log.log_date or date.today(),
        weight=log.weight,
        reps=log.reps,
        sets=log.sets,
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@router.get("/exercises/{exercise_id}/logs", response_model=List[schemas.LogOut])
def get_logs(
    exercise_id: int,
    days_back: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    exercise = (
        db.query(models.Exercise)
        .filter(models.Exercise.id == exercise_id, models.Exercise.user_id == current_user.id)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    cutoff = date.today() - timedelta(days=days_back)
    return (
        db.query(models.Log)
        .filter(models.Log.exercise_id == exercise_id, models.Log.date >= cutoff)
        .order_by(models.Log.date.desc())
        .all()
    )


@router.get("/today", response_model=List[schemas.ExerciseWithStreak])
def get_today(
    days_back: int = 30,
    day_of_week: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    The home screen: today's exercises (based on the CLIENT's local weekday,
    passed in as day_of_week), each with its current streak and the last
    `days_back` days of history for the horizontal scroll.

    Falls back to the server's own clock only if the client didn't send one -
    the server runs on UTC, so relying on it directly is wrong for anyone west
    of UTC in the evening (their local day has not rolled over yet server-side).
    """
    today_dow = day_of_week if day_of_week is not None else date.today().weekday()
    exercises = (
        db.query(models.Exercise)
        .filter(models.Exercise.user_id == current_user.id, models.Exercise.day_of_week == today_dow)
        .order_by(models.Exercise.order_index)
        .all()
    )

    cutoff = date.today() - timedelta(days=days_back)
    results = []
    for ex in exercises:
        history = (
            db.query(models.Log)
            .filter(models.Log.exercise_id == ex.id, models.Log.date >= cutoff)
            .order_by(models.Log.date.desc())
            .all()
        )
        streak = calculate_streak(history)
        results.append(
            schemas.ExerciseWithStreak(
                id=ex.id,
                name=ex.name,
                day_of_week=ex.day_of_week,
                order_index=ex.order_index,
                preferred_unit=ex.preferred_unit,
                custom_image=ex.custom_image,
                rest_seconds=ex.rest_seconds,
                latest_weight=history[0].weight if history else None,
                latest_date=history[0].date if history else None,
                streak=streak,
                history=history,
            )
        )
    return results
