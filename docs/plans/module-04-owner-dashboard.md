# Module 4 — Owner Dashboard

**Status:** Approved  
**Approved:** 2026-06-21  
**Rollback point:** Git tag `module-3-complete`  
**Branch:** `rahulevol/module-4-owner-dashboard`

## Goal

Allow complete Venue Owner accounts to create draft venues and safely manage only
their own venue operations, courts, weekly availability, generated slots, and offline
blocks.

## Approved decisions

- Owners create their own venues in `draft`.
- New and materially edited venue profiles require admin review before Player
  visibility.
- Owners can read and manage only venues, courts, mappings, rules, and slots they own.
- Owners can add venue images by public URL in this module.
- Owners configure recurring weekly availability rules.
- The system regenerates unbooked display slots seven days ahead.
- Changes to future unbooked slots go live immediately.
- Held or booked slots remain immutable to owners.
- Owners can block and unblock future slots for maintenance, private events, or offline
  bookings, with a required reason and audit history.
- The UI shows a read-only 5% platform commission estimate; no ledger or payment
  mutation is created yet.
- The activity route remains an inbox shell until booking/payment modules exist.

## Included

- Live owner dashboard metrics.
- Owner venue creation and editing.
- Draft, pending review, active, rejected, and suspended status presentation.
- Venue review submission with image, court, and supported-sport readiness checks.
- Court/turf/ground creation and editing.
- Court-to-sport configuration.
- Weekly availability rules.
- Seven-day slot regeneration.
- Future slot block/unblock controls.
- Immutable owner operations audit log.
- Loading, empty, validation, and error states.

## Excluded

- Admin approval interface.
- Player booking creation.
- Payment holds, Razorpay, refunds, payouts, or commission ledger entries.
- Editing held or booked slots.
- Historical slot deletion.
- File uploads to Supabase Storage.
- Booking request accept/reject actions.

## Security gates

- Anonymous and Player accounts cannot read owner operational data.
- Owners cannot read or mutate another owner’s records.
- `owner_user_id` cannot be reassigned.
- Owners cannot directly mark venues active, approved, featured, or suspended.
- Venue review submission requires at least one image, one active court, and one active
  supported sport.
- Slot changes are limited to future, unheld, unbooked records.
- Blocking one physical court time window applies across its supported sports.
- Important owner changes create append-only audit records.

## Done when

- Live Supabase migration and migration history pass.
- SQL verification proves cross-owner isolation.
- Owner dashboard, venue manager, court/rule editor, and slot block controls use live
  data.
- TypeScript, lint, production build, database advisors, and browser QA pass.
