import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

import models
import schemas
from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.profile_picture is not None:
        current_user.profile_picture = payload.profile_picture
    if payload.name is not None:
        current_user.name = payload.name
    if payload.last_name is not None:
        current_user.last_name = payload.last_name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user.email,
        password_hash=hash_password(user.password),
        name=user.name,
        last_name=user.last_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm uses "username" field; we treat it as email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/google", response_model=schemas.Token)
def google_login(payload: schemas.GoogleLogin, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured on the server")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    google_id = idinfo["sub"]
    email = idinfo.get("email")
    given_name = idinfo.get("given_name", "")
    family_name = idinfo.get("family_name", "")
    picture = idinfo.get("picture")

    user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if not user:
        # Might already have an account registered with email/password - link it
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user.google_id = google_id
        else:
            user = models.User(
                email=email,
                password_hash=None,
                name=given_name or "Google",
                last_name=family_name or "User",
                profile_picture=picture,
                google_id=google_id,
            )
            db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
