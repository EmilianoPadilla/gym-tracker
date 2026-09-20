from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/day-labels", tags=["day-labels"])


@router.get("", response_model=List[schemas.DayLabelOut])
def get_day_labels(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Only returns days that have a custom label set - unset days just use the weekday name client-side."""
    return db.query(models.DayLabel).filter(models.DayLabel.user_id == current_user.id).all()


@router.put("/{day_of_week}", response_model=schemas.DayLabelOut)
def set_day_label(
    day_of_week: int,
    payload: schemas.DayLabelUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not 0 <= day_of_week <= 6:
        raise HTTPException(status_code=400, detail="day_of_week must be 0 (Monday) to 6 (Sunday)")

    existing = (
        db.query(models.DayLabel)
        .filter(models.DayLabel.user_id == current_user.id, models.DayLabel.day_of_week == day_of_week)
        .first()
    )
    if existing:
        existing.label = payload.label
        existing.is_rest_day = payload.is_rest_day
        db.commit()
        db.refresh(existing)
        return existing

    new_label = models.DayLabel(
        user_id=current_user.id,
        day_of_week=day_of_week,
        label=payload.label,
        is_rest_day=payload.is_rest_day,
    )
    db.add(new_label)
    db.commit()
    db.refresh(new_label)
    return new_label
