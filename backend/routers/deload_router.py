from datetime import date
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/deload-days", tags=["deload-days"])


@router.get("", response_model=List[date])
def list_deload_days(
    start: date,
    end: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Dates (within start..end inclusive) the user marked as deload days."""
    rows = (
        db.query(models.DeloadDay.date)
        .filter(
            models.DeloadDay.user_id == current_user.id,
            models.DeloadDay.date >= start,
            models.DeloadDay.date <= end,
        )
        .all()
    )
    return sorted(r[0] for r in rows)


@router.put("/{day}")
def set_deload_day(
    day: date,
    payload: schemas.DeloadUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing = (
        db.query(models.DeloadDay)
        .filter(models.DeloadDay.user_id == current_user.id, models.DeloadDay.date == day)
        .all()
    )
    if payload.is_deload and not existing:
        db.add(models.DeloadDay(user_id=current_user.id, date=day))
    elif not payload.is_deload:
        for row in existing:
            db.delete(row)
    db.commit()
    return {"date": day, "is_deload": payload.is_deload}
