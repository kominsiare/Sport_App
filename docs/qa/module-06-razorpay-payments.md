# Module 6 Razorpay Payments QA

**Date:** 2026-06-22
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

## Pending interactive QA

- complete one successful test payment;
- verify Checkout return shows processing, not confirmation;
- verify the real Razorpay-generated webhook confirms the booking;
- inspect Player and Owner screens at desktop and mobile widths.

The provider connection, webhook registration, signed-endpoint check, order creation,
captured/failed webhook transitions, idempotency, amount validation, and cleanup are
complete. Final visual and real Razorpay Checkout verification remains pending.
