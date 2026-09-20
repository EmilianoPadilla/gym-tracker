# Gym Tracker API

FastAPI backend for the gym tracker — same pattern as the Obolus backend (JWT auth,
SQLAlchemy, Pydantic schemas). Use this if/when you want real accounts (email +
password) instead of the simple named-profile version in the HTML prototype.

## Run locally

```bash
pip install -r requirements.txt --break-system-packages
uvicorn main:app --reload
```

Uses SQLite by default (`gym_tracker.db`, created automatically). Docs at
`http://localhost:8000/docs`.

## Deploy (same as Obolus)

1. Push this to a GitHub repo.
2. Create a PostgreSQL database on Supabase or Render.
3. Deploy to Render as a web service; set the `DATABASE_URL` env var to your
   Postgres connection string and `SECRET_KEY` to a random string.
4. Point your frontend's API base URL at the deployed service.

## Endpoints

- `POST /auth/register` — create an account
- `POST /auth/login` — get a JWT (OAuth2 password flow: `username` = email)
- `POST /exercises` — add an exercise to your routine (`day_of_week`: 0=Monday...6=Sunday)
- `GET /exercises?day_of_week=0` — list routine, optionally filtered by day
- `POST /exercises/{id}/logs` — log a weight for an exercise
- `GET /exercises/{id}/logs` — history for one exercise
- `GET /today` — today's exercises with streak + history, ready for the home screen

## Streak logic (crud.py)

Sorts an exercise's logs newest-first and counts how many consecutive sessions
share the latest weight. 1 = green, 2 = orange, 3+ = red (time to increase weight).

## Known dependency pin

`bcrypt` is pinned to `4.0.1` — newer bcrypt releases break `passlib` 1.7.4's
version check. If you upgrade passlib later, you can unpin this.
