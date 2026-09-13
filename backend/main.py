from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models
from routers import auth_router, exercises_router, logs_router, body_metrics_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend's domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(exercises_router.router)
app.include_router(logs_router.router)
app.include_router(body_metrics_router.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "gym-tracker-api"}
