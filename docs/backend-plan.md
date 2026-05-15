# Backend plan

## Recommendation

Supabase is the chosen backend for Carnet Rose: generous free tier, PostgreSQL, row-level security, Google/Apple OAuth, and a JavaScript client that works with Expo, React Native and PWA builds. Local-first SQLite (native) and IndexedDB (web) remain the source of truth; Supabase is used for auth and one-way push sync.

## Comparison

| Option         | Strengths                                                                    | Limits                                                                      |
| -------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Supabase       | PostgreSQL, free tier, Google/Apple auth, RLS, REST API, realtime path later | Careful RLS policies and conflict handling needed for offline sync          |
| Firebase       | Mature auth, good free tier, strong mobile support                           | Less relational data model, migration less direct, separate rules skill set |
| Appwrite Cloud | Open-source style, auth and database included                                | Smaller ecosystem, less direct PostgreSQL fit                               |

## Architecture (current)

Local-first, with Supabase layered on top:

- `database/storage.native.js` — native SQLite, offline.
- `database/storage.web.js` — IndexedDB/localforage, offline; keeps the Klassia → CarnetRose migration.
- `services/supabase/supabaseClient.js` — Supabase REST/auth gateway, disabled without public env vars.
- `services/auth/authService.js` — Google/Apple sign-in, session handling (web localStorage, refresh token never persisted).
- `services/sync/` — `classSyncService`, `studentSyncService`, `historySyncService`, orchestrated by `syncService` (one-way push of local changes).

Sign-in is mandatory (`navigation/RootNavigator.js` gates the app behind `AuthStack`).

## Environment

Only public Supabase values belong in Expo env:

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=
EXPO_PUBLIC_APP_URL=
```

Never commit `.env`. The anon/publishable key is not a server secret, but data access must be protected by Supabase Row Level Security.
In GitHub Actions, keep `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_APP_URL` in Variables, and `EXPO_PUBLIC_SUPABASE_KEY` in Secrets.

## Next Steps

1. Create/maintain Supabase tables for classes, students, history and term archives with `user_id` (see `docs/supabase-schema.sql`).
2. Keep RLS policies so each user only reads/writes their own rows.
3. Add two-way sync with conflict rules based on `updatedAt` / `derniereUtilisation`.
4. Add data export (Settings → Export) — currently a placeholder.
