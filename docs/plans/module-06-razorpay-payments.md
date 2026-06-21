# Module 6 — Razorpay Advance Payments

**Status:** Approved
**Approved:** 2026-06-21
**Rollback point:** Git tag `module-5-complete`
**Branch:** `rahulevol/module-6-razorpay-payments`

## Goal

Collect the fixed ₹500 advance through Razorpay Test Mode and confirm a booking only
after a valid, idempotently processed Razorpay webhook proves the payment was captured.

## Approved decisions

- Razorpay Standard Checkout is used.
- Every payment uses a server-created Razorpay Order for ₹500 (`50000` paise).
- The Razorpay key secret and webhook secret are server-only.
- The frontend success handler never confirms a booking. It may only show
  `payment_processing`.
- A booking is confirmed only after a signed `payment.captured` or `order.paid`
  webhook is validated.
- Webhook duplicates are identified through `x-razorpay-event-id`.
- Payment, order, booking, commission, and audit identifiers are unique and
  idempotently processed.
- Commission is 5% of the immutable total booking amount.
- Commission is collected from the ₹500 advance first.
- When commission exceeds ₹500, ₹500 is recorded as collected and the remainder is
  recorded as `owner_due` for manual beta reconciliation.
- Automated refunds are excluded. Admin handles refund decisions and processing in
  Module 7.
- Razorpay Test Mode remains mandatory until order, checkout, and webhook verification
  pass end to end.

## Included

- Payment, confirmed-booking, commission, and webhook-event tables.
- Payment/order state and immutable booking snapshots.
- Safe, idempotent Razorpay order claims and deterministic receipts.
- Supabase Edge Function for authenticated order creation.
- Supabase Edge Function for authenticated Checkout-return verification.
- Public HTTPS Supabase Edge Function for signed Razorpay webhooks.
- Captured-payment confirmation transaction.
- Cross-sport physical-court booking finalization.
- Payment-failure release.
- Captured-after-conflict manual-review state.
- Player checkout, processing, confirmed receipt, and payment-history UI.
- Owner confirmed-booking and commission visibility.
- RLS, explicit grants, service-role-only webhook mutations, and append-only audit
  records.

## Excluded

- Live Mode credentials or real customer charges.
- Automated refunds or cancellation deductions.
- Payout automation or automatic owner settlements.
- Remaining-payment collection.
- Completion, no-show, dispute, or admin override UI.
- Custom Admin dashboard.

## Security and integrity gates

- Client input never controls amount, currency, commission, or confirmation.
- Razorpay order amount and receipt are created from the locked database snapshot.
- Checkout-return signatures are verified server-side but remain non-confirming.
- Webhooks use the raw request body for HMAC-SHA256 validation.
- Webhook event IDs, order IDs, and payment IDs are unique.
- Captured events verify order ID, payment ID, amount, currency, and gateway status.
- Direct authenticated writes to payment, booking, commission, and webhook tables are
  denied.
- Privileged database transitions are callable only by `service_role`.
- Captured payments that can no longer safely reclaim the court become
  `captured_review` instead of creating a double booking.

## Done when

- Live migrations and migration history pass.
- Order creation is idempotent under concurrent requests.
- Invalid signatures, amounts, currencies, order IDs, and duplicate webhooks are
  rejected or safely ignored.
- Only a signed captured webhook creates the booking and commission record.
- Player and Owner views use live payment data with RLS isolation.
- TypeScript, lint, production build, database advisors, Edge Function deployment,
  route QA, and Test Mode payment QA pass.
