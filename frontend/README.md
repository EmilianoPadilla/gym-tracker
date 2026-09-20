# Gym Tracker — Frontend

React + TypeScript + Tailwind frontend for the gym tracker. Same stack and
deployment pattern as the Obolus frontend.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Make sure the backend (gym-tracker-backend) is running locally at
http://localhost:8000, or point VITE_API_BASE_URL in `.env` at wherever it's
deployed.

## Deploy (same as Obolus)

1. Deploy the backend first (see its own README) — get its live URL.
2. Push this repo to GitHub.
3. Import it in Vercel.
4. In Vercel's project settings, add an environment variable:
   `VITE_API_BASE_URL` = your deployed backend URL (e.g. the Render URL).
5. Deploy. Vercel builds with `npm run build` automatically.

## How "stay logged in" works

On login, the JWT token is saved to the browser's localStorage
(src/api/client.ts). Every API call reads it from there and attaches it as
an Authorization header. On app load, AuthContext checks for a saved token
and calls GET /auth/me to confirm it's still valid — if it is, the user
lands straight on the Today screen with no login prompt. If the token is
missing or expired, they're sent to /login. Tokens are valid for 30 days
(configurable in the backend's auth.py), after which they'll need to log in
again once.

## Add to Home Screen (iPhone)

Once deployed, open the site in Safari → Share → Add to Home Screen. It
launches full-screen without Safari's UI, using the manifest.json and meta
tags already set up in index.html.

## Structure

- `src/api/client.ts` — all backend calls, token storage
- `src/context/AuthContext.tsx` — session state, silent token validation on load
- `src/pages/Today.tsx` — home screen, auto-detects the weekday
- `src/pages/Routine.tsx` — add/remove exercises per day
- `src/components/ExerciseCard.tsx` — weight input, streak badge, history scroll
