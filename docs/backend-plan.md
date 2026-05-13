# Backend plan

## Recommendation

Supabase is the best fit for Carnet Rose. It provides a generous free tier, PostgreSQL, row-level security, OAuth providers including Google and Apple, and a JavaScript client that works with Expo, React Native, and PWA builds. The current local-first SQLite and IndexedDB storage should remain the source of truth until sync is implemented and tested.

## Comparison

| Option | Strengths | Limits |
| --- | --- | --- |
| Supabase | PostgreSQL, free tier, Google/Apple auth, RLS, REST API, realtime/sync path later, works for PWA | Requires careful RLS policies and conflict handling for offline sync |
| Firebase | Mature auth, good free tier, strong mobile support | Firestore data model is less relational, export/migration can be less direct, rules are a separate skill set |
| Appwrite Cloud | Open source style, auth and database included | Smaller ecosystem than Supabase/Firebase, less direct PostgreSQL fit |

## Proposed Architecture

Keep the app local-first:

- `database/storage.native.js`: native SQLite remains available offline.
- `database/storage.web.js`: IndexedDB/localforage remains available offline and keeps the Klassia to CarnetRose migration.
- `services/api/supabaseClient.js`: optional Supabase REST gateway, disabled without public env vars.
- `services/auth/authService.js`: future Google/Apple auth boundary.
- `services/sync/classSyncService.js` and `services/sync/studentSyncService.js`: future sync boundaries.

## Environment

Only public Supabase values are expected in Expo:

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit `.env`. The anonymous key is not a server secret, but data access must be protected by Supabase Row Level Security.

## Next Steps

1. Add `@supabase/supabase-js` when auth work begins.
2. Create Supabase tables for classes, students, events, and term archives with `user_id`.
3. Enable RLS policies so each user only reads/writes their own rows.
4. Configure Google OAuth and Apple Sign In in Supabase.
5. Add account screens without blocking local mode.
6. Implement one-way backup, then two-way sync with conflict rules based on `updatedAt` or `derniereUtilisation`.
