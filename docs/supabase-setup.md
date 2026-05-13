# Supabase setup

Carnet Rose stays local-first. SQLite on native and IndexedDB/localforage on web remain the primary storage. Supabase is optional and only enables online auth and future backup/sync.

## Create a Supabase project

1. Create a free Supabase project.
2. Open Project Settings, then API.
3. Copy the Project URL into `EXPO_PUBLIC_SUPABASE_URL`.
4. Copy the anon public key into `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
5. Keep service-role keys out of the app and out of Git.

Use `.env` locally:

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_APP_URL=https://gryzax.github.io/carnet-rose/
```

`.env` is ignored by Git. `.env.example` is the only committed env file.

## Database

Open the Supabase SQL editor and run `docs/supabase-schema.sql` manually. The SQL creates:

- `profiles`
- `classes`
- `students`
- `events`
- `term_archives`
- `sync_state`

RLS is enabled. Policies restrict reads and writes to `auth.uid()`.

## Google OAuth

Google sign-in requires Supabase and Google Cloud setup:

1. Create OAuth credentials in Google Cloud.
2. Add the Supabase callback URL shown in Authentication > Providers > Google.
3. Enable Google in Supabase Auth providers.
4. Add client id/secret in Supabase, not in the app repo.

## Apple OAuth

Apple sign-in requires Supabase and Apple Developer setup:

1. Configure Sign in with Apple in Apple Developer.
2. Add the Supabase callback URL shown in Authentication > Providers > Apple.
3. Enable Apple in Supabase Auth providers.
4. Store Apple provider values in Supabase, not in the app repo.

## Current limits

The current implementation prepares optional auth and sync boundaries. Sync is intentionally conservative: if Supabase is absent, the user is not connected, or a sync error happens, local data remains untouched. The first conflict strategy is "newest `updated_at` wins", with `deleted_at` reserved for soft-delete propagation.

