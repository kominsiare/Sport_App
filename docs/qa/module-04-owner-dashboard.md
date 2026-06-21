# Module 4 Owner Dashboard QA

**Date:** 2026-06-21
**Branch:** `rahulevol/module-4-owner-dashboard`
**Rollback tag:** `module-3-complete`

## Automated checks

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run build` — pass
- `git diff --check` — pass
- committed-file secret scan — pass

## Live Supabase verification

**Project:** `pllayz` (`ap-south-1`)

- Local and remote migration histories match.
- Anonymous roles cannot read weekly availability or owner audit records.
- Anonymous roles cannot execute owner review, slot-generation, or slot-block RPCs.
- Authenticated Owner accounts receive the required table and RPC privileges.
- A full transactional owner scenario passed:
  - Owner One saw one owned venue and zero Owner Two venues.
  - Cross-owner updates affected zero rows.
  - A weekly rule generated two future slots.
  - Blocking one slot created one physical-court offline block.
  - Eight owner operation audit events were recorded.
  - Review submission changed the venue to `pending_review`.
- Security-definer implementation functions remain in the unexposed `private` schema.
- Player and Owner read policies were consolidated.
- Supabase performance advisors report no warnings.

## Security advisor notes

- The two authenticated profile RPC warnings are intentional and predate Module 4.
  Both validate `auth.uid()`, whitelist fields, and deny anonymous execution.
- Supabase leaked-password protection remains a provider-dashboard recommendation.

## Authenticated route verification

A temporary fully verified Owner identity and venue fixture were created, used, and
deleted automatically.

- `/app/owner` — HTTP 200 with the live dashboard marker.
- `/app/owner/venues` — HTTP 200 with the portfolio manager marker.
- `/app/owner/venues/[venueId]/slots` — HTTP 200 with live venue operations.
- `/app/owner/requests` — HTTP 200 with the operations activity marker.
- Owner access to Player routes emits a streamed `NEXT_REDIRECT` to `/app/owner`.
- Temporary auth, profile, venue, court, rule, slot, and audit fixtures were removed.

## Included user workflows

- Create and edit a private venue draft with a primary image URL.
- Add or edit courts/turfs/grounds and supported sports.
- Add, edit, pause, resume, or delete weekly availability rules.
- Regenerate seven days of future unbooked slots.
- Block or unblock future physical-court windows with a required reason.
- Submit a complete venue for admin review.
- View operation history and read-only 5% commission estimates.

## Remaining manual visual check

Automated control of the in-app browser was unavailable. Before converting the draft
pull request to ready for review, visually inspect the Owner dashboard and venue
operations page at desktop and mobile widths.
