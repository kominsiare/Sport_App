# Supabase Auth Connection Guide

The application code and migration are safe to commit. Real credentials belong only in `.env.local` and provider dashboards.

## Current project status

The `pllayz` Supabase project in AWS Mumbai (`ap-south-1`) is connected locally.

- Module 2 migration: applied.
- Module 3 venue browsing migrations: applied.
- Module 4 owner dashboard migrations: applied.
- Module 5 booking hold migrations: applied.
- Module 6 Razorpay payment and service-role hardening migrations: applied.
- Module 7 team matchmaking migration: applied and verified on 2026-07-08.
- Email-or-phone booking eligibility and rolling demo-slot migrations: applied and
  verified on 2026-07-24.
- Site URL: `https://pllayz-app.vercel.app`.
- Redirect URLs: `https://pllayz-app.vercel.app/auth/confirm` for email links and
  `https://pllayz-app.vercel.app/auth/callback` for OAuth.
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

Module 7 adds team opponent matchmaking on top of confirmed bookings. A Player can
publish a future confirmed booking as an open opponent search, and one other verified
Player team can join that same slot without creating another booking hold, Razorpay
order, payment, refund, or settlement. The migration file is:

```text
supabase/migrations/20260708100000_module_7_team_matchmaking.sql
```

As of 2026-07-08, this migration is live in the hosted Supabase project. Remote
verification confirmed `matchmaking_posts`, `matchmaking_feed`,
`create_matchmaking_post`, `join_matchmaking_post`, `cancel_my_matchmaking_post`, and
`expire_matchmaking_posts`. Supabase DB lint reported no schema errors after the push.
The app keeps a defensive fallback so pages do not crash if a future environment is
missing the Module 7 objects.

The 2026-07-24 recovery migrations make verified email-link accounts first-class
booking and matchmaking participants and add an authenticated rolling refresh for the
fictional venue catalog:

```text
supabase/migrations/20260724165610_enable_email_matchmaking_and_refresh_demo_slots.sql
supabase/migrations/20260724165706_refresh_system_owned_demo_catalog_slots.sql
```

The refresh is idempotent and limited to the reserved fictional seed venue UUID range.
It does not alter real owner-created venues, payment records, or confirmed bookings.
Live verification produced 854 available slots across the next 14 dates, enabled both
complete Players, denied anonymous RPC execution, and preserved the existing captured
Razorpay payment and confirmed booking.

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
- All 20 active seed venues have a dedicated verified system owner, so booking and
  commission owner references are valid.
- Captured, duplicate, mismatched-amount, and failed webhook scenarios passed with
  temporary fixtures and cleanup.
- One interactive Test Checkout captured ₹500 INR and produced the expected confirmed
  booking and 5% commission record.
- Temporary Player phone verification was reverted after Checkout. A complete Player
  with a verified email remains booking-enabled without phone verification.
- Player and Owner payment screens passed desktop and exact 390px mobile visual QA
  without overflow, clipping, incorrect payment states, or final route runtime errors.
- Module 6 is ready for review.

The seed-owner credentials are stored only in macOS Keychain. Module 7 Admin operations
must provide a controlled venue-claim/reassignment workflow before real venue onboarding.

An Owner created through email can complete onboarding after the required name,
business name, and city fields are saved and either email or phone is verified. Phone
verification remains available for deployments that configure Twilio Verify, but it
is no longer required in addition to a verified email.

## 3. Configure redirect URLs

In **Authentication → URL Configuration**:

- Production Site URL: `https://pllayz-app.vercel.app`
- Hosted redirect allow-list: `https://pllayz-app.vercel.app/**`

The hosted Supabase project is intentionally Vercel-only for tester sign-in. Local
development redirects should be added only when actively testing the local app, then
removed again before sharing the hosted PWA. Supabase falls back to the configured Site
URL when the requested callback is not allow-listed.

Vercel Production and Preview must also set:

```text
NEXT_PUBLIC_APP_URL=https://pllayz-app.vercel.app
```

This public app origin was verified on 2026-07-20 after a stale
`http://localhost:3000` value caused hosted email sign-in links to open the wrong
domain.

## 4. Configure email sign-in

Enable Email authentication.

The connected Free project currently uses Supabase's default secure Magic Link email.
The app labels this accurately as **Email link**.

The hosted Free project cannot customize Auth email templates while using Supabase's
default email provider. To keep the PWA usable without upgrading or adding SMTP, email
sign-in requests use Supabase's implicit magic-link flow and redirect to
`/auth/confirm?account_type=...&next=...`. The `/auth/confirm` client page reads the
one-time session from the URL fragment, calls `/auth/session` to store the session in
SSR cookies, and then routes the user to onboarding or the correct workspace.

Supabase projects created after June 3, 2026 cannot customize Auth email templates
while using the default email provider on the Free plan. To switch to a six-digit email
OTP later:

1. Configure custom SMTP or upgrade to a plan that permits template customization.
2. Change the Magic Link template to use `{{ .Token }}` instead of
   `{{ .ConfirmationURL }}`.
3. Restore the six-digit email-code entry state in the login UI.

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
