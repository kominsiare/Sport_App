# Pllayz

Pllayz is a Tricity-first, login-gated, multi-sport venue-booking PWA for players and venue owners.

## Current milestone

Module 1 builds the production frontend foundation:

- Next.js App Router with TypeScript
- mobile-first responsive app shell
- installable PWA manifest and service worker
- Night Match visual system
- reusable UI and marketplace components
- public landing and login placeholders
- player and owner route placeholders

No real authentication, Supabase data, booking mutation, or Razorpay integration is included in Module 1.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
