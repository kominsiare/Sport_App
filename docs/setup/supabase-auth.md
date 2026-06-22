# Supabase Auth Connection Guide

The application code and migration are safe to commit. Real credentials belong only in `.env.local` and provider dashboards.

## Current project status

The `pllayz` Supabase project in AWS Mumbai (`ap-south-1`) is connected locally.

- Module 2 migration: applied.
- Module 3 venue browsing migrations: applied.
- Module 4 owner dashboard migrations: applied.
- Module 5 booking hold migrations: applied.
- Module 6 Razorpay payment and service-role hardening migrations: applied.
- Site URL: `http://localhost:3000`.
- Redirect URL: `http://localhost:3000/auth/callback`.
- Web publishable key: stored only in ignored `.env.local`.
- Email provider: enabled.
- Phone provider: waiting for Twilio Verify credentials.
- Google provider: waiting for a Google OAuth client ID and secret.
- Custom SMTP: not configured.

## 1. Create or select a Supabase project

Use the India-adjacent region that best matches the launch market and your operational requirements.

In **Project Settings → API**, copy:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Create `.env.local` from `.env.example`. Never commit `.env.local`.

## 2. Apply the migration

Apply `supabase/migrations/202606200001_auth_foundation.sql` through the Supabase SQL Editor or CLI.

This step is already complete for the connected `pllayz` project.

The migration creates:

- immutable Player/Owner profiles,
- server-owned admin records,
- contact uniqueness constraints,
- profile onboarding functions,
- contact synchronization,
- Row Level Security policies.

Module 3 additionally creates the approved venue catalog, courts, supported sports,
venue images, and read-only slots. Its migrations are tracked in the linked Supabase
project and should be applied through `supabase db push`.

Module 4 adds ownership-scoped venue operations, weekly availability rules, rolling
slot generation, offline blocks, and append-only owner audit records. Player and Owner
read policies are consolidated to avoid duplicate RLS evaluation.

Module 5 adds immutable ten-minute booking snapshots, physical-court overlap exclusion,
one-active-hold enforcement, cancellation and expiry RPCs, Player/Owner read isolation,
and append-only booking audit events.

Module 6 adds Razorpay order/payment state, webhook-confirmed booking snapshots,
commission records, idempotent webhook events, and three deployed Edge Functions.
Razorpay Test Mode credentials and the signed Dashboard webhook are connected.

## Razorpay Test Mode connection

Create Test Mode API keys in Razorpay, then store them as Supabase Edge Function
secrets:

```bash
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_test_your_key_id \
  RAZORPAY_KEY_SECRET=your_test_key_secret \
  RAZORPAY_WEBHOOK_SECRET=your_random_webhook_secret \
  --project-ref mljvwgboykoynsdqhhvl
```

In Razorpay **Webhooks**, register:

```text
https://mljvwgboykoynsdqhhvl.supabase.co/functions/v1/razorpay-webhook
```

Use the same `RAZORPAY_WEBHOOK_SECRET` and subscribe to:

- `payment.captured`
- `payment.failed`
- `order.paid`

Keep Razorpay in Test Mode until the full checkout and webhook QA passes. Never add
Razorpay secrets to `.env.local`, source files, Git, or browser-exposed environment
variables.

Current Test Mode status:

- API key authentication verified.
- Edge Function secrets configured.
- Webhook active at the URL above.
- `payment.captured`, `payment.failed`, and `order.paid` enabled.
- Signed webhook readiness check passed.
- Server-created ₹500 INR order smoke test passed.
- One interactive Test Checkout and captured webhook confirmation remain before this
  module is ready for review.

## 3. Configure redirect URLs

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` for local development.
- Additional redirect URL: `http://localhost:3000/auth/callback`
- Add the production origin and `/auth/callback` after deployment.

The localhost values are already configured. Production values remain pending until the
application has a stable deployment URL.

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
