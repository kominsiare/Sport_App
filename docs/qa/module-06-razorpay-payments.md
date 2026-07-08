# Module 6 Razorpay Payments QA

**Date:** 2026-06-23
**Branch:** `rahulevol/module-6-razorpay-payments`
**Rollback tag:** `module-5-complete`

## Automated checks

- TypeScript app check — pass
- ESLint — pass
- Next.js production build — pass
- React component checklist — pass
- `git diff --check` — pass
- Edge Function remote bundle/deployment — pass

## Live Supabase verification

**Project:** `pllayz` (`ap-south-1`)

- Module 6 schema and service-role hardening migrations are live.
- Local and remote migration histories match.
- Database lint reports no schema errors.
- Remote type generation includes payments, bookings, commission records, webhook
  events, and payment-processing hold state.
- `razorpay-order`, `razorpay-payment-return`, and `razorpay-webhook` Edge Functions are
  deployed.
- Anonymous table reads and payment-transition RPC calls return permission denied.
- Unauthenticated order creation returns `401 unauthorized`.
- Unsigned webhook requests return `400 missing_webhook_headers`.
- The service role can reach privileged payment transitions; a fake payment ID reaches
  the expected semantic `payment_not_found` error rather than a permission error.
- Razorpay Test Mode API credentials are stored only as Supabase Edge Function secrets
  and macOS Keychain items.
- Razorpay Test API authentication passes against the Orders endpoint.
- One active Test Mode webhook targets the deployed Supabase HTTPS endpoint.
- The webhook has a secret and enables only `payment.captured`, `payment.failed`, and
  `order.paid`.
- A correctly signed readiness event returns HTTP 200; an unsigned event returns HTTP
  400.
- A temporary verified Player created an app order through `razorpay-order`; Razorpay
  returned `created` for exactly ₹500 INR with the deterministic 37-character receipt.
- The temporary Player, owner reference, venue assignment, hold, payment, audit, and
  held-slot state were removed after the order smoke test.
- A dedicated verified system-owner identity now owns all 20 previously unowned active
  seed venues, preserving valid booking and commission ownership until Admin venue
  claiming/reassignment is implemented.
- A signed `payment.captured` event created exactly one booking, one 5% commission
  record, and a captured payment.
- Redelivery with the same Razorpay event ID was idempotently ignored.
- A signed captured event with an amount mismatch created no booking and recorded a
  failed webhook event.
- A signed `payment.failed` event changed the payment to failed, expired the hold, and
  released all overlapping physical-court slots.
- All temporary webhook QA identities, orders, database rows, and slot mutations were
  removed.
- A real interactive Razorpay Test Checkout captured exactly ₹500 INR.
- Razorpay independently reports the payment as captured against the app-created order.
- The real `payment.captured` webhook created one confirmed booking and a ₹110
  commission record from the ₹2,200 immutable booking total.
- The real `order.paid` webhook was idempotently processed against the same booking.
- The authenticated Checkout-return callback was verified and appended its audit event.
- The temporary phone verification used for interactive Test Checkout was fully
  reverted; the Player profile again has no phone and `can_book = false`.

## Implemented integrity checks

- The ₹500 amount and INR currency come only from the locked database snapshot.
- Razorpay order receipts are deterministic, unique, and within the 40-character limit.
- The browser callback cannot create a booking.
- Checkout signatures are verified server-side against the stored order.
- Webhook signatures use the untouched raw request body.
- `x-razorpay-event-id`, order IDs, and payment IDs enforce idempotency.
- Captured webhook processing creates the booking and 5% commission atomically.
- Physical-court conflicts produce `captured_review` instead of a double booking.
- Direct authenticated writes to payment, booking, commission, and webhook tables are
  denied.

## Visual QA

- Player booking/payment receipt passed at 1280px desktop and 390px mobile:
  booking `1492DA94`, `Booking confirmed`, `Paid`, `Razorpay verified`,
  ₹500 paid, and ₹1,700 remaining were readable without horizontal overflow,
  clipping, or broken spacing.
- Owner dashboard passed at 1280px desktop and exactly 390px mobile:
  one confirmed booking, ₹500 Razorpay advances collected, ₹110 Pllayz
  commission retained, and ₹0 manual owner due were readable and correctly
  stacked at both widths.
- Owner Activity passed at 1280px desktop and exactly 390px mobile:
  `Webhook confirmed`, `Confirmed`, `Paid`, ₹2,200 booking total, ₹500 paid,
  ₹110 Pllayz fee, ₹390 owner advance credit, and ₹0 manual owner due all
  rendered without overflow, clipping, unreadable text, or incorrect payment
  states.
- The final desktop and mobile route loads returned HTTP 200 with no browser
  console/runtime errors in the development server log.
- No Checkout, order-creation, payment, refund, or settlement action was
  initiated during visual QA.
- Owner onboarding now explicitly explains that Twilio Verify must be
  configured before an email-created Owner can verify a mobile number and
  enter the workspace.

The provider connection, webhook registration, signed-endpoint check, order creation,
captured/failed webhook transitions, idempotency, amount validation, and cleanup are
complete. The real Razorpay Checkout, Checkout-return verification, captured webhook,
booking confirmation, commission record, and responsive Player/Owner visual QA also
pass.

## 2026-07-08 UI refresh and opponent-finder follow-up

- Re-imagined the app UI around the ImageGen sports-arena direction: darker glass
  surfaces, court-line backgrounds, cyan/lime accents, stronger page headers, refreshed
  cards, buttons, badges, inputs, landing, auth, player, owner, venue, booking, and
  payment surfaces.
- Added the team opponent-finder implementation without changing Razorpay payment
  semantics: a confirmed future booking can publish one active open/matched listing,
  and another verified Player team can join that same slot without initiating another
  checkout or payment.
- Added `supabase/migrations/20260708100000_module_7_team_matchmaking.sql` with
  `matchmaking_posts`, `matchmaking_feed`, RLS, and RPCs for create/join/cancel/expire.
- Remote Supabase application passed on the retry: `supabase db push --linked --yes`
  applied `20260708100000_module_7_team_matchmaking.sql`.
- Remote verification confirmed `matchmaking_posts`, `matchmaking_feed`, and all 4
  public matchmaking RPCs.
- Supabase DB lint after the migration reported no schema errors.
- Local checks passed: ESLint, TypeScript, and `next build`.
- Dev server HTTP smoke passed: `/` returned 200, `/login?next=/app/player/opponents`
  returned 200, and unauthenticated `/app/player/opponents` correctly redirected to
  `/login?next=%2Fapp%2Fplayer%2Fopponents`.
- Browser visual automation was unavailable in this run: the in-app/Chrome bridge tool
  was not exposed and the `agent-browser` executable was not installed, so no new
  desktop/mobile screenshot QA is claimed for this follow-up.
- No Checkout, order creation, payment, refund, settlement, or Razorpay write action
  was initiated.
