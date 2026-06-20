# Supabase Auth Connection Guide

The application code and migration are safe to commit. Real credentials belong only in `.env.local` and provider dashboards.

## 1. Create or select a Supabase project

Use the India-adjacent region that best matches the launch market and your operational requirements.

In **Project Settings → API**, copy:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Create `.env.local` from `.env.example`. Never commit `.env.local`.

## 2. Apply the migration

Apply `supabase/migrations/202606200001_auth_foundation.sql` through the Supabase SQL Editor or CLI.

The migration creates:

- immutable Player/Owner profiles,
- server-owned admin records,
- contact uniqueness constraints,
- profile onboarding functions,
- contact synchronization,
- Row Level Security policies.

## 3. Configure redirect URLs

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` for local development.
- Additional redirect URL: `http://localhost:3000/auth/callback`
- Add the production origin and `/auth/callback` after deployment.

## 4. Configure email OTP

Enable Email authentication.

Use `{{ .Token }}` in the email template when you want a six-digit OTP rather than a magic link.

Supabase’s default email service is suitable only for development. Configure custom SMTP before public beta.

## 5. Configure Google

In Google Auth Platform:

1. Create a Web application OAuth client.
2. Add the app origin under Authorized JavaScript origins.
3. Add the Supabase callback URL shown on the Supabase Google provider page under Authorized redirect URIs.
4. Add the client ID and secret to **Authentication → Providers → Google**.

## 6. Configure Twilio Verify

In Twilio:

1. Create a Verify Service.
2. Complete India sender and TRAI DLT requirements before production traffic.
3. Add the Twilio credentials and Verify Service SID to the Supabase phone provider settings.
4. Enable phone authentication.

Set conservative OTP rate limits and enable CAPTCHA before public beta to control abuse and SMS cost.

## 7. Verification

After `.env.local` is present and providers are configured:

```bash
npm run dev
```

Test Player and Owner accounts separately. A verified contact already associated with one account type must not be used to create the other account type.

