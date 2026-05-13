# Supabase setup

This project is prepared for Supabase Auth and future sync. Do not commit real Supabase keys. Keep local values in `.env`, which is ignored by Git.

## Environment variables

Copy `.env.example` to `.env` locally and fill:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_APP_URL=https://gryzax.github.io/carnet-rose/
```

For the GitHub Pages PWA, add the same values in GitHub:

Settings -> Secrets and variables -> Actions -> Variables

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_APP_URL`

## Supabase Auth URLs

In Supabase Authentication -> URL Configuration:

Site URL:

```txt
https://gryzax.github.io/carnet-rose/
```

Redirect URLs to add:

```txt
https://gryzax.github.io/carnet-rose/
https://gryzax.github.io/carnet-rose/auth/callback
http://localhost:8081
http://localhost:19006
```

Redirect URLs must match exactly what the app uses. Supabase uses these URLs to authorize OAuth returns after login.

## Google Auth

1. Go to Google Cloud Console.
2. Create or select a project.
3. Configure OAuth consent screen.
4. Create an OAuth Client ID of type Web application.
5. Add Authorized JavaScript origins:
   - `https://gryzax.github.io`
   - `http://localhost:8081`
   - `http://localhost:19006`
6. Add Authorized redirect URIs:
   - `https://[PROJECT_REF].supabase.co/auth/v1/callback`
7. Copy the Client ID and Client Secret.
8. In Supabase, go to Authentication -> Providers -> Google.
9. Enable Google.
10. Paste the Client ID and Client Secret.

Do not commit the Client ID or Client Secret to this repository.

## Apple Auth

Apple Sign-In usually requires an Apple Developer account.

Configure in Apple Developer:

- App ID or Service ID;
- Sign in with Apple enabled;
- Supabase domain / redirect URL;
- key / secret values required by the selected Apple configuration.

In Supabase:

Authentication -> Providers -> Apple

Fill the Apple values requested by Supabase.

Supabase callback generally used:

```txt
https://[PROJECT_REF].supabase.co/auth/v1/callback
```

Without Apple Developer configuration, the Apple button can remain visible, but it will not work until the provider is configured.

## Database schema

Run `docs/supabase-schema.sql` manually in the Supabase SQL editor when you are ready to create the database tables and RLS policies. Do not run it automatically from the app.
