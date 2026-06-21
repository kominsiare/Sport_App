# Module 6 Razorpay Payments QA

**Date:** 2026-06-21
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

## Pending provider QA

Razorpay Test Mode credentials are not yet connected. After the keys and webhook secret
are stored:

- complete one successful test payment;
- verify Checkout return shows processing, not confirmation;
- verify the signed webhook creates exactly one booking and commission row;
- resend the same webhook and confirm it is treated as a duplicate;
- test a failed payment and confirm the hold/slots are released;
- test invalid signatures, amount mismatch, and payment-ID mismatch;
- inspect Player and Owner screens at desktop and mobile widths.

Automated in-app browser control was unavailable in this session, so final visual and
real Razorpay Checkout verification remains pending.
