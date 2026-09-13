from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.post("", response_model=schemas.ExerciseOut)
def create_exercise(
    exercise: schemas.ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not 0 <= exercise.day_of_week <= 6:
        raise HTTPException(status_code=400, detail="day_of_week must be 0 (Monday) to 6 (Sunday)")

    new_exercise = models.Exercise(**exercise.model_dump(), user_id=current_user.id)
    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)
    return new_exercise


@router.get("", response_model=List[schemas.ExerciseOut])
def list_routine(
    day_of_week: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Full routine, or filtered to a single day (0=Monday ... 6=Sunday)."""
    query = db.query(models.Exercise).filter(models.Exercise.user_id == current_user.id)
    if day_of_week is not None:
        query = query.filter(models.Exercise.day_of_week == day_of_week)
    return query.order_by(models.Exercise.order_index).all()


@router.patch("/{exercise_id}/order", response_model=schemas.ExerciseOut)
def update_exercise_order(
    exercise_id: int,
    payload: schemas.ExerciseReorder,
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
    exercise.order_index = payload.order_index
    db.commit()
    db.refresh(exercise)
    return exercise


@router.patch("/{exercise_id}/unit", response_model=schemas.ExerciseOut)
def update_exercise_unit(
    exercise_id: int,
    payload: schemas.ExerciseUnitUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.preferred_unit not in ("kg", "lbs"):
        raise HTTPException(status_code=400, detail="preferred_unit must be 'kg' or 'lbs'")

    exercise = (
        db.query(models.Exercise)
        .filter(models.Exercise.id == exercise_id, models.Exercise.user_id == current_user.id)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    exercise.preferred_unit = payload.preferred_unit
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}")
def delete_exercise(
    exercise_id: int,
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
    db.delete(exercise)
    db.commit()
    return {"detail": "Deleted"}
