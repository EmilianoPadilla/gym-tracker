# Gym Tracker

A private workout tracker built for personal and family use. Opens straight
to today's exercises, logs weights, times rest between sets, and flags
progressive overload with a streak badge (green → orange → red = time to add
weight). Available as a website, an installable PWA, and as native Android
and iOS apps.

## Features

- **Daily routine view** — shows the exercises assigned to today's weekday,
  with a previous/next day navigator to log or review any other day
- **Progressive overload tracking** — color-coded history chips per exercise
  (green = new weight, orange = 2nd session at that weight, red = 3+)
- **Rest timers** — a per-exercise timer using each exercise's configured
  rest duration, plus a floating custom timer for any arbitrary time
- **Body metrics tracking** — weight, muscle mass, fat %, visceral fat, with
  range-filterable charts
- **Calendar history** — browse and edit any past day's logged weights
- **Custom routines per day** — name each day (e.g. "Push day"), mark rest
  days, drag to reorder exercises, per-exercise kg/lbs units
- **505-exercise library** with images (via RepDB), plus support for
  personal custom photos on specific exercises
- **Google Sign-In** — works on the website and inside the native apps (via
  a native plugin, since Google blocks its JS sign-in flow inside embedded
  WebViews)
- **Bilingual** — English and Spanish, switchable in Settings
- **Installable everywhere** — as a browser PWA (Add to Home Screen), or as
  a real Android APK / iOS app via Capacitor

## Project structure

```
gym-tracker/
  backend/    FastAPI + PostgreSQL API (JWT auth, per-user routines and logs)
  frontend/   React + TypeScript + Tailwind app
  android/    Capacitor-generated native Android project
  ios/        Capacitor-generated native iOS project
```

The native apps don't bundle a fixed copy of the frontend - they load the
live deployed website directly (Capacitor's `server.url` config). Pushing a
normal code change to the frontend updates the website *and* every installed
native app immediately, with no rebuild needed. Rebuilding Android Studio /
Xcode is only required for native-level changes: a new Capacitor plugin,
changed permissions, a new app icon, or (on iOS with a free Apple ID) the
signing certificate's 7-day renewal.

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL (hosted on Supabase), deployed
  to Render
- **Frontend:** React, TypeScript, Tailwind, Vite, deployed to Vercel
- **Mobile:** Capacitor (Android + iOS), wrapping the live website
- **Auth:** JWT (email/password) and Google Sign-In (web via Google
  Identity Services; native via `@capawesome/capacitor-google-sign-in`)

## Deploying from this one repo

Push this whole folder as a single GitHub repo. Then:

**Backend → Render**
- New Web Service, connect this repo
- **Root Directory:** `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `DATABASE_URL` (Supabase Postgres connection
  string, pooler URL), `SECRET_KEY` (any random long string),
  `GOOGLE_CLIENT_ID` (web OAuth client ID), `PYTHON_VERSION=3.11.9`
- Copy the live URL Render gives you when it's done

**Frontend → Vercel**
- Import this repo
- **Root Directory:** `frontend`
- Environment variables: `VITE_API_BASE_URL` (the Render URL above),
  `VITE_GOOGLE_CLIENT_ID` (same web OAuth client ID, as a Config value)
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

## Building the native apps

Both platforms load the live deployed website (see `frontend/capacitor.config.ts`),
so these steps are only needed for the initial install or for native-level
changes - not for regular content/code updates.

**Android**

```bash
cd frontend
npm install
npm run build
npx cap sync android
```

Then open the `android/` folder in Android Studio and use
**Build → Generate Signed Bundle / APK** with your keystore to produce a
distributable `.apk`. Reuse the same keystore every time so updates install
over the previous version instead of being treated as a new app.

**iOS**

```bash
cd frontend
npm install
npm run build
npx cap sync ios
```

Then open `ios/App/App.xcodeproj` in Xcode, connect a device, and press Run.
With a free (non-paid) Apple Developer account, the app's certificate
expires after 7 days - repeat the connect-and-run step weekly to renew it.

## Google Sign-In setup

Three OAuth clients exist under the same Google Cloud project:

- **Web** - used by the website's JS sign-in flow, and passed as the
  `clientId` to the native plugin on both platforms
- **Android** - package name `com.emilianopadilla.gymtracker` + the
  signing keystore's SHA-1 fingerprint. Its **Advanced settings → Enable
  Custom URI Scheme** must be turned on, or native sign-in can fail with a
  `400: invalid_request` error on iOS (the flow can fall back to a
  browser-based redirect that needs this enabled on the Android client).
- **iOS** - bundle ID `com.emilianopadilla.gymtracker`. Its client ID is
  set in `frontend/ios/App/App/Info.plist` under `GIDClientID` and the
  reversed form under `CFBundleURLTypes`.

If any of these three clients ever get deleted/recreated, the SHA-1 and
bundle ID must match exactly, and the iOS `Info.plist` values must be
updated to the new client ID.
