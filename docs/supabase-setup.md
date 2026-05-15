# Supabase setup

Provider setup for Supabase Auth and sync. Never commit real keys — keep local
values in `.env` (Git-ignored).

## Environment variables

Copy `.env.example` to `.env` and fill:

```env
EXPO_PUBLIC_SUPABASE_URL=https://frmiyddfipejirtbzoxr.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=    # the sb_publishable_... anon key — never a service_role key
EXPO_PUBLIC_APP_URL=https://gryzax.github.io/carnet-rose/
```

For the GitHub Pages PWA, add the same three variables in GitHub → Settings →
Secrets and variables → Actions → Variables.

## Auth URLs

In Supabase → Authentication → URL Configuration:

- **Site URL:** `https://gryzax.github.io/carnet-rose/`
- **Redirect URLs:** the Site URL, `…/auth/callback`, `http://localhost:8081`,
  `http://localhost:19006`

Redirect URLs must match exactly what the app uses.

## Google Auth

1. In Google Cloud Console, create/select a project and configure the OAuth consent screen.
2. Create an OAuth Client ID of type **Web application**:
   - Authorized JavaScript origins: `https://gryzax.github.io`, `http://localhost:8081`, `http://localhost:19006`
   - Authorized redirect URI: `https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/callback`
3. In Supabase → Authentication → Providers → Google, enable it and paste the Client ID and Secret.

Do not commit the Client ID or Secret.

## Apple Auth

Requires an Apple Developer account. In Apple Developer, create an App ID /
Service ID with Sign in with Apple enabled and the Supabase callback
`https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/callback`. Fill the requested
values in Supabase → Authentication → Providers → Apple.

Until configured, the Apple button can stay visible but will not work.

## Database schema

Run `docs/supabase-schema.sql` manually in the Supabase SQL Editor to create the
tables and RLS policies. Do not run it automatically from the app.
