import calendar as calendar_module
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(tags=["history"])


@router.get("/logs/by-date", response_model=List[schemas.LogWithExercise])
def get_logs_by_date(
    log_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Every logged exercise for one specific calendar date - the day-detail view behind the calendar."""
    rows = (
        db.query(models.Log, models.Exercise.name)
        .join(models.Exercise, models.Log.exercise_id == models.Exercise.id)
        .filter(models.Exercise.user_id == current_user.id, models.Log.date == log_date)
        .all()
    )
    return [
        schemas.LogWithExercise(
            id=log.id,
            exercise_id=log.exercise_id,
            exercise_name=name,
            date=log.date,
            weight=log.weight,
            reps=log.reps,
            sets=log.sets,
        )
        for log, name in rows
    ]


@router.get("/calendar-summary")
def get_calendar_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Which dates in this month have at least one logged entry - powers the dots on the calendar grid."""
    _, days_in_month = calendar_module.monthrange(year, month)
    start = date(year, month, 1)
    end = date(year, month, days_in_month)

    rows = (
        db.query(models.Log.date)
        .join(models.Exercise, models.Log.exercise_id == models.Exercise.id)
        .filter(models.Exercise.user_id == current_user.id, models.Log.date >= start, models.Log.date <= end)
        .distinct()
        .all()
    )
    return {"dates_with_logs": sorted(r[0].isoformat() for r in rows)}


@router.patch("/logs/{log_id}", response_model=schemas.LogWithExercise)
def update_log(
    log_id: int,
    payload: schemas.LogUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Edit a specific log entry - including moving it to a different date. This is
    what lets someone reassign a session: e.g. they skipped Wednesday's leg day
    but worked out Thursday instead, so they move Thursday's entries onto Wednesday.
    """
    log = (
        db.query(models.Log)
        .join(models.Exercise, models.Log.exercise_id == models.Exercise.id)
        .filter(models.Log.id == log_id, models.Exercise.user_id == current_user.id)
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")

    if payload.weight is not None:
        log.weight = payload.weight
    if payload.log_date is not None:
        log.date = payload.log_date
    if payload.reps is not None:
        log.reps = payload.reps
    if payload.sets is not None:
        log.sets = payload.sets

    db.commit()
    db.refresh(log)
    return schemas.LogWithExercise(
        id=log.id,
        exercise_id=log.exercise_id,
        exercise_name=log.exercise.name,
        date=log.date,
        weight=log.weight,
        reps=log.reps,
        sets=log.sets,
    )


@router.delete("/logs/{log_id}")
def delete_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    log = (
        db.query(models.Log)
        .join(models.Exercise, models.Log.exercise_id == models.Exercise.id)
        .filter(models.Log.id == log_id, models.Exercise.user_id == current_user.id)
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(log)
    db.commit()
    return {"detail": "Deleted"}
