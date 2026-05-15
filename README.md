# Carnet Rose

Expo app for tracking students: classes, ticks, crosses, merits, detentions, history and per-term archiving. Runs on Android (APK) and as a PWA.

## Features

- Classes and students with search and sorting
- Ticks / crosses with reasons; 4 ticks → merit, 4 crosses → detention
- 30s undo on tick/cross actions
- Per-term history and archiving
- Statistics: merits/detentions charts, top 3 bright sparks / to watch
- Multilingual UI: English (default), French, Spanish — auto-detected, overridable in Settings
- Mandatory Google / Apple sign-in via Supabase; data stays local, optional sync
- Light-mode-only cozy hand-drawn design (see `DESIGN.md`)

## Requirements

- Node.js LTS, npm
- Expo Go for local development

## Setup

```bash
npm install
npx expo start          # dev
npm run start:clear     # dev, clear Metro cache
npm test                # tests with coverage (target: 80%)
```

Data is stored locally: `expo-sqlite` on native, IndexedDB (localforage) on web.

## Configuration

The app requires Supabase for Google/Apple sign-in. Never commit `.env`, OAuth keys, a `service_role` key, or any secret.

Copy `.env.example` to `.env` and set:

```env
EXPO_PUBLIC_SUPABASE_URL=https://frmiyddfipejirtbzoxr.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=    # use the sb_publishable_... key
EXPO_PUBLIC_APP_URL=https://gryzax.github.io/carnet-rose/
```

For the GitHub Pages PWA, add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_APP_URL` in GitHub → Settings → Secrets and variables → Actions → Variables.
Store `EXPO_PUBLIC_SUPABASE_KEY` in GitHub → Settings → Secrets and variables → Actions → Secrets.

Full provider setup (Supabase Auth URLs, Google Cloud, Apple) is in `docs/supabase-setup.md`. The DB schema and RLS policies are in `docs/supabase-schema.sql` — run it manually in the Supabase SQL Editor.

## Install on iPhone (PWA)

No Expo Go, Expo account, Apple Developer account, TestFlight or App Store needed.

1. Open the PWA link in Safari.
2. Share → Add to Home Screen → Add.
3. Launch from the home screen icon.

First launch needs Internet; afterwards the app works offline once cached. Data is stored locally via IndexedDB.

## Build Android APK

### Via GitHub Actions (no Expo account)

GitHub → Actions → **Build Android APK** → Run workflow. Download the **carnet-rose-debug-apk** artifact and install `app-debug.apk`. Output path: `android/app/build/outputs/apk/debug/app-debug.apk`. This is a debug build — sufficient for testing.

### Via EAS cloud (optional, signed builds)

Requires an Expo account and EAS CLI (`npm install -g eas-cli`, then `eas login`; a local `eas-cli` devDependency is also available).

```bash
npm run build:android:apk          # preview profile → installable .apk
npm run build:android:production   # production profile → .aab for Play Store
```

`eas.json` defines the `preview` and `production` profiles. EAS returns a download link at the end of the build.

## Structure

```txt
/models        SQLite queries and data structures
/controllers   business logic
/views         React Native screens
/components    reusable UI components
/database      connection, migrations, demo seed, web/native storage
/hooks         data-loading hooks
/navigation    React Navigation stack + bottom tabs (auth gate)
/services      Supabase client, auth, sync
/constants     colors, strings, i18n catalogue, business constants
/utils         i18n provider, date and prefs helpers
/__tests__     unit, database and component tests
```

## MVC Architecture

Views render the UI and delegate actions to controllers. Controllers apply business rules, then call models. Models are the only layer that touches storage, via `/database/db.js`.

## Git Workflow

`main` stays stable. `dev` integrates finished features. Each significant feature branches off `dev` as `feature/...`, then merges back after tests.
