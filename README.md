# Pllayz

Pllayz is a Tricity-first, login-gated, multi-sport venue-booking PWA for players and venue owners.

## Current milestone

Module 6 adds Razorpay Test Mode advance payments and webhook-confirmed bookings:

- Next.js App Router with TypeScript
- installable PWA manifest and service worker
- Night Match visual system
- Supabase SSR session handling
- immutable Player and Venue Owner account types
- 20 fictional, admin-approved Tricity venues
- live sport, city, area, price, and sorting filters
- venue details with courts, supported sports, prices, and live slot selection
- Player-only venue RLS and explicit anonymous-access denial
- owner-created private venue drafts and admin-review submission
- ownership-scoped court, sport, weekly availability, and slot management
- rolling seven-day slot generation and audited offline blocking
- read-only 5% commission estimates
- immutable booking snapshots and one active hold per Player
- atomic cross-sport physical-court overlap prevention
- live hold countdown, cancellation, expiry, and history
- Owner read-only visibility into payment-hold demand
- append-only booking audit events
- server-created Razorpay orders for the fixed ₹500 advance
- server-side Checkout-return signature verification
- raw-body Razorpay webhook signature verification and event idempotency
- booking confirmation only after a captured-payment webhook
- immutable Player booking receipts and payment history
- Owner confirmed-booking and payment visibility
- 5% commission ledger with advance-first collection and manual owner-due tracking
- PWA caching that excludes authenticated pages

Razorpay Live Mode, automated refunds, payouts, and admin operations remain in later
modules.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flutter app

The Android/iOS client lives in [`mobile/`](mobile/README.md) and shares the
hosted Supabase, booking, Razorpay, Owner operations, and opponent-finder
backend with this Next.js app. Android beta installation and QA details are in
[`docs/qa/flutter-mobile.md`](docs/qa/flutter-mobile.md).

To connect Supabase, follow [docs/setup/supabase-auth.md](docs/setup/supabase-auth.md).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Planned sequence

1. Design system + app shell
2. Authentication
3. Venue browsing
4. Owner dashboard
5. Booking flow
6. Razorpay payments
7. Admin operations
