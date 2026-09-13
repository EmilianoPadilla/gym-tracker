# Gym Tracker

A workout tracker that opens straight to today's exercises, logs weights, and
flags progressive overload with a streak badge (green → orange → red = time
to add weight).

```
gym-tracker/
  backend/    FastAPI + PostgreSQL API (JWT auth, per-user routines and logs)
  frontend/   React + TypeScript + Tailwind app (login persists on device)
```

Each folder has its own README with setup details. This top-level one just
covers how the two pieces fit together for deployment.

## Deploying from this one repo

Push this whole folder as a single GitHub repo. Then:

**Backend -> Render**
- New Web Service, connect this repo
- **Root Directory:** `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `DATABASE_URL` (Supabase Postgres connection string),
  `SECRET_KEY` (any random long string)
- Copy the live URL Render gives you when it's done

**Frontend -> Vercel**
- Import this repo
- **Root Directory:** `frontend`
- Environment variable: `VITE_API_BASE_URL` = the Render URL from above
- Deploy

Vercel and Render each only look inside their assigned Root Directory, so
pushing to this one repo updates both independently without them stepping on
each other.

## Local development

Two terminals, from this folder:

```bash
cd backend && pip install -r requirements.txt --break-system-packages && uvicorn main:app --reload
```

```bash
cd frontend && npm install && cp .env.example .env && npm run dev
```
