# Pllayz

Pllayz is a Tricity-first, login-gated, multi-sport venue-booking PWA for players and venue owners.

## Current milestone

Module 4 adds ownership-scoped venue operations:

- Next.js App Router with TypeScript
- installable PWA manifest and service worker
- Night Match visual system
- Supabase SSR session handling
- immutable Player and Venue Owner account types
- 20 fictional, admin-approved Tricity venues
- live sport, city, area, price, and sorting filters
- venue details with courts, supported sports, prices, and read-only slots
- Player-only venue RLS and explicit anonymous-access denial
- owner-created private venue drafts and admin-review submission
- ownership-scoped court, sport, weekly availability, and slot management
- rolling seven-day slot generation and audited offline blocking
- read-only 5% commission estimates
- PWA caching that excludes authenticated pages

Player booking mutations, Razorpay, commission ledgers, and admin approval UI remain
in later modules.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
