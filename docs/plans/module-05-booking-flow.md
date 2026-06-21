# Module 5 — Booking Flow

**Status:** Approved  
**Approved:** 2026-06-21  
**Rollback point:** Git tag `module-4-complete`  
**Branch:** `rahulevol/module-5-booking-flow`

## Goal

Let complete Player accounts create one safe, ten-minute payment hold for an approved
venue slot while preventing overlapping holds across every sport on the same physical
court.

## Approved decisions

- The latest payment-at-booking specification supersedes the older owner
  accept-or-reject request flow.
- A Player selects an available slot and reviews an immutable booking snapshot before
  starting a hold.
- A hold lasts ten minutes.
- The first valid server-created hold wins concurrent attempts.
- One active payment hold is allowed per Player account.
- A hold blocks every overlapping slot on the same physical court, including slots for
  other supported sports.
- Expired and cancelled holds release their physical court window.
- A Player can cancel an unpaid hold immediately.
- Owners receive read-only operational visibility and no accept/reject controls.
- Owner views do not expose Player contact information.
- Module 5 shows the future ₹500 advance but does not create a payment, commission, or
  confirmed booking.
- Human-readable confirmed booking codes begin after verified payment in Module 6.

## Included

- Atomic booking-hold creation through a database RPC.
- Immutable venue, court, sport, schedule, duration, and price snapshot fields.
- Database-enforced physical-court overlap prevention.
- One-active-hold-per-Player enforcement.
- Lazy server expiry plus live client countdown expiry.
- Player cancellation.
- Player hold history and status UI.
- Owner read-only hold activity.
- Append-only booking audit events.
- RLS, grants, indexes, and explicit anonymous denial.
- Empty, loading, error, unavailable, concurrent-conflict, and expiry states.

## Excluded

- Razorpay order creation or checkout.
- Payment records, webhook verification, or confirmed bookings.
- Commission ledger entries or money movement.
- Refund, cancellation-fee, completion, remaining-payment, dispute, or payout logic.
- Owner acceptance or rejection.
- Custom admin UI.

## Security and data gates

- Only complete, booking-enabled Player accounts can create holds.
- Only future slots at active, admin-approved venues can be held.
- Booking mutations are exposed only through narrow authenticated RPCs.
- Public tables use RLS and receive only required grants.
- Security-definer implementation functions remain in the unexposed `private` schema
  with an empty search path.
- Concurrency protection is enforced in PostgreSQL, not through frontend state.
- Snapshot fields cannot be rewritten by authenticated clients.
- Owners can read holds only for venues they own.
- Players can read only their own holds and audit events.

## Done when

- The live migration and migration history pass.
- Transaction tests prove one-player and cross-player conflicts, cross-sport blocking,
  cancellation, expiry, snapshot integrity, and owner isolation.
- Player slot selection, review, countdown, cancellation, and history use live data.
- Owner activity shows active and historical holds without mutation controls.
- TypeScript, lint, production build, database advisors, route QA, and secret scanning
  pass.
