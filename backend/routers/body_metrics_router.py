from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/body-metrics", tags=["body-metrics"])


@router.post("", response_model=schemas.BodyMetricOut)
def upsert_body_metric(
    payload: schemas.BodyMetricCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    One entry per day. If the user already logged a reading today (or for the
    given date), this updates it in place rather than creating a duplicate -
    useful since someone might step on the scale, then correct a typo later.
    """
    entry_date = payload.metric_date or date.today()
    existing = (
        db.query(models.BodyMetric)
        .filter(models.BodyMetric.user_id == current_user.id, models.BodyMetric.date == entry_date)
        .first()
    )

    if existing:
        if payload.weight is not None:
            existing.weight = payload.weight
        if payload.muscle_mass is not None:
            existing.muscle_mass = payload.muscle_mass
        if payload.fat_percentage is not None:
            existing.fat_percentage = payload.fat_percentage
        if payload.visceral_fat is not None:
            existing.visceral_fat = payload.visceral_fat
        db.commit()
        db.refresh(existing)
        return existing

    new_entry = models.BodyMetric(
        user_id=current_user.id,
        date=entry_date,
        weight=payload.weight,
        muscle_mass=payload.muscle_mass,
        fat_percentage=payload.fat_percentage,
        visceral_fat=payload.visceral_fat,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("", response_model=List[schemas.BodyMetricOut])
def get_body_metrics(
    days_back: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cutoff = date.today() - timedelta(days=days_back)
    return (
        db.query(models.BodyMetric)
        .filter(models.BodyMetric.user_id == current_user.id, models.BodyMetric.date >= cutoff)
        .order_by(models.BodyMetric.date.asc())
        .all()
    )
