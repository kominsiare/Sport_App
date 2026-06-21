# Module 5 Booking Flow QA

**Date:** 2026-06-21
**Branch:** `rahulevol/module-5-booking-flow`
**Rollback tag:** `module-4-complete`

## Automated checks

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run build` — pass
- React component review — pass
- `git diff --check` — pass
- committed-file secret scan — pass

## Live Supabase verification

**Project:** `pllayz` (`ap-south-1`)

- Local and remote migration histories match through the two Module 5 migrations.
- Database lint reports no schema errors.
- Supabase performance advisors report no warnings.
- Anonymous roles cannot read booking holds or booking audit events.
- Anonymous roles cannot execute create, cancel, or expiry RPCs.
- Authenticated roles receive only the required read and RPC privileges.
- Security-definer implementations remain in the unexposed `private` schema with an
  empty search path.

## Concurrency and lifecycle verification

Temporary fully verified Player and Owner identities were created and removed
automatically.

- Two Players attempted overlapping Cricket and Football slots on the same physical
  court concurrently.
- Exactly one Player received a `payment_pending` hold.
- The losing attempt returned `slot_no_longer_available`.
- Both overlapping sport slot rows changed to `held`.
- A second hold attempt by the winning Player returned
  `active_booking_hold_exists`.
- The owning Owner could read one hold; an unrelated Owner read zero.
- Player One could read one hold; Player Two read zero.
- A slot price was changed from ₹2,200 to ₹9,999 after hold creation; the stored
  snapshot remained ₹2,200.
- Player cancellation changed the hold to `cancelled` and released both sport slots.
- Forced timeout changed a later hold to `expired` and released both sport slots.
- Create plus cancellation/expiry produced two append-only audit events per hold.
- All temporary users, identities, sessions, profiles, holds, and audit events were
  removed.

## Authenticated route verification

Production-mode server rendering passed with temporary Player and Owner sessions:

- `/app/player/bookings` — HTTP 200 with live payment-hold UI.
- `/app/player/venues/sector-seven-sports-yard` — HTTP 200 with live slot-selection UI.
- Player access to `/app/owner` redirects to `/app/player`.
- `/app/owner` — HTTP 200 with the live dashboard marker.
- `/app/owner/requests` — HTTP 200 with read-only Player hold activity.
- Owner access to `/app/player/bookings` redirects to `/app/owner`.

## Included user workflows

- Review a future approved venue slot.
- Create one ten-minute payment hold.
- Block overlapping sports on the same physical court.
- View a live countdown and immutable price/schedule snapshot.
- Cancel an unpaid hold immediately.
- Release expired holds safely.
- Review cancelled and expired hold history.
- Let Owners see operational hold demand without Player contact details or decisions.

## Remaining manual visual check

Automated control of the in-app browser is unavailable in this session. Before
converting the draft pull request to ready for review, inspect the venue slot picker,
review drawer, countdown card, history cards, and Owner activity feed at desktop and
mobile widths.
