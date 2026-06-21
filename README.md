# Pllayz

Pllayz is a Tricity-first, login-gated, multi-sport venue-booking PWA for players and venue owners.

## Current milestone

Module 2 adds the production authentication boundary:

- Next.js App Router with TypeScript
- installable PWA manifest and service worker
- Night Match visual system
- Supabase SSR session handling
- phone OTP, email OTP, and Google sign-in flows
- immutable Player and Venue Owner account types
- profile and contact-verification onboarding
- protected, account-specific workspaces
- profile RLS, restricted mutation functions, and audit logging

Venue records, booking mutations, Razorpay, and admin operations remain in later modules.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To connect authentication, follow [docs/setup/supabase-auth.md](docs/setup/supabase-auth.md).

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
