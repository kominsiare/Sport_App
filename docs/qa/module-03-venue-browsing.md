# Module 3 Venue Browsing QA

**Date:** 2026-06-21
**Branch:** `rahulevol/module-3-venue-browsing`  
**Rollback tag:** `module-2-complete`

## Automated checks

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run build` — pass
- `git diff --check` — pass
- service-worker syntax check — pass
- committed-file secret scan — pass

## Live Supabase verification

**Project:** `pllayz` (`ap-south-1`)

- Local and remote migration histories match.
- 20 venues, 20 mandatory images, 24 courts, 35 court/sport mappings, and 427
  seven-day display slots exist.
- The `venue_catalog` view returns all 20 approved venues to a complete Player profile.
- Every seeded venue has an image.
- Anonymous clients have no `SELECT` privilege on venue tables or `venue_catalog`.
- Authenticated clients have catalog access, with Player eligibility and approved venue
  visibility enforced by RLS.
- Venue trigger and RLS helper functions live in the unexposed `private` schema.
- Trigger-only auth functions were moved out of the exposed API schema.
- Profile RPCs deny anonymous execution and remain callable by authenticated users.
- Supabase performance advisors report no warnings.

## Security advisor notes

- `ensure_my_profile` and `update_my_profile` intentionally remain authenticated
  `SECURITY DEFINER` RPCs. Both validate `auth.uid()`, accept only whitelisted fields,
  and deny anonymous execution.
- Supabase leaked-password protection remains a provider-dashboard recommendation.

## Browser status

- The local development server starts successfully from
  `/Users/rahulsingh/Downloads/Pllayz_App`.
- Login and authenticated Player/Owner route separation passed in Module 2.
- After clearing the stale Turbopack cache left by the folder move, repeated login,
  manifest, and protected-route requests complete without a runtime panic.
- The signed-in Player venue list returned HTTP 200.
- The `Sector Seven Sports Yard` live detail route returned HTTP 200.
- The first catalog image is loaded eagerly to avoid the above-the-fold LCP warning.
- Automated visual inspection remained unavailable, so pixel-level visual QA should be
  confirmed manually before converting the draft pull request to ready for review.
