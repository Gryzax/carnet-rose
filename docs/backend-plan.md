# Backend plan

## Choice

Supabase is the backend: generous free tier, PostgreSQL, row-level security,
Google/Apple OAuth, and a JS client that works across Expo, React Native and
PWA builds. Firebase and Appwrite were considered but fit the relational model
and Postgres/RLS workflow less directly.

Local storage stays the source of truth — `expo-sqlite` on native, IndexedDB
(localforage) on web. Supabase handles auth and sync.

## Architecture

Local-first with an offline outbox:

- `database/storage.native.ts` / `storage.web.ts` — offline cache; web keeps the Klassia → CarnetRose migration.
- `database/outbox.ts` — every write hits the cache immediately, then pushes to Supabase or queues here when offline.
- `services/supabase/supabaseClient.ts` — Supabase REST/auth gateway, disabled without public env vars.
- `services/auth/authService.ts` — Google/Apple sign-in and sessions (web localStorage; refresh token never persisted).
- `services/remote/` — per-entity remote APIs (`classRemote`, `studentRemote`, `historyRemote`).
- `repositories/` — flush-then-pull on demand; called by React Query hooks.
- `sync/` — `flushOutbox` drains queued writes; `syncManager` triggers it on app start, on reconnect, and on a slow interval.

Sign-in is mandatory: `navigation/RootNavigator.tsx` gates the app behind the auth stack.

## Environment

Only public Supabase values belong in Expo env:

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=
EXPO_PUBLIC_APP_URL=
```

Never commit `.env`. The publishable key is not a server secret, so data access
must be protected by Supabase Row Level Security.

## Next steps

1. Keep Supabase tables and RLS policies in sync with `docs/supabase-schema.sql` (each user reads/writes only their own rows).
2. Add conflict resolution to the outbox flush based on `updatedAt` / `derniereUtilisation`.
3. Add data export (Settings → Export) — currently a placeholder.
