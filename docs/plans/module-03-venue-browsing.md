# Module 3 — Venue Browsing

**Status:** Approved  
**Approved:** 2026-06-20  
**Rollback point:** Git tag `module-2-complete`  
**Branch:** `rahulevol/module-3-venue-browsing`

## Goal

Allow authenticated Player accounts to browse admin-approved sports venues across
Chandigarh, Mohali, and Panchkula using live Supabase data.

## Approved decisions

- Seed 20 clearly fictional Tricity demo venues.
- Distribute venues across Chandigarh, Mohali, and Panchkula.
- Mandatory venue fields:
  - name,
  - city,
  - area,
  - address,
  - coordinates,
  - description,
  - approval status,
  - at least one image before approval.
- Only active, admin-approved venues are visible to Player accounts.
- Beta filters:
  - sport,
  - city,
  - area,
  - price range.
- Display “From ₹…” using the lowest active supported court price.
- Sorting:
  - recommended first,
  - lowest price,
  - name.
- Venue details show courts/turfs/grounds, supported sports, durations, and prices.
- Slots remain read-only in this module.

## Included

- `sports`, `venues`, `venue_images`, `courts`, `court_sports`, and read-only `slots`.
- Database constraints and indexes.
- Authenticated Player read policies.
- Owner/admin write paths remain unavailable to clients in this module.
- Live sport, city, area, price, and sort controls.
- Venue list and venue detail routes.
- Loading, empty, not-found, and error handling.
- Fictional seed content and reusable venue image assets.

## Excluded

- Owner venue creation or editing.
- Venue approval UI.
- Weekly availability editing or slot generation.
- Booking holds, booking records, Razorpay, refunds, reviews, or ratings.
- Custom admin panel.

## Security gates

- Anonymous users cannot read venue, court, sport, image, or slot records.
- Owner accounts cannot use Player venue routes.
- Player reads expose only venues with `status = 'active'` and an approval record.
- Child records are visible only when their parent venue passes the same visibility rule.
- No direct client insert, update, or delete grants are added.

## Done when

- The migration and seed run successfully in the connected Supabase project.
- All 20 venues are visible only through authenticated Player access.
- Filters and sorting work against live data.
- Venue detail pages show live courts and read-only slot states.
- Lint, TypeScript, production build, browser QA, and live RLS checks pass.
