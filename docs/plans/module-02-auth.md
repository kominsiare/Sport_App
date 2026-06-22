# Module 2 — Supabase Auth Implementation

**Status:** Implemented; live provider verification pending
**Approved:** 2026-06-20  
**Rollback point:** Git tag `module-1-complete`  
**Branch:** `rahulevol/module-2-auth`

## Goal

Add secure, login-gated access with Supabase Auth while preserving separate Player and Venue Owner identities.

## Confirmed decisions

- Authentication provider: Supabase Auth.
- Login methods: phone OTP, secure email link on the connected Free project, Google.
- Account types are separate: `player` or `owner`.
- Account type is selected before signup and becomes immutable.
- The same verified phone or email cannot belong to both account types.
- Google login is available for both account types.
- Player profile requires full name, Tricity city, and at least one verified contact.
- A player must have a verified phone before booking; browsing remains allowed with another verified contact.
- Owner profile requires full name, business name, Tricity city, verified phone, and verified email.
- Owner accounts do not need admin approval to enter the owner workspace.
- Owner-created venues still require admin approval before visibility or booking.
- SMS provider direction: Twilio Verify.
- Admin access is never assignable from the client.

## Included

- Supabase SSR clients and session refresh proxy.
- Phone OTP, secure email-link, and Google OAuth flows.
- OAuth callback and OTP verification.
- Profile onboarding and contact-completion states.
- Account-type-aware redirects and protected routes.
- Logout and session persistence.
- `profiles` and server-owned `admin_users` tables.
- Row Level Security and restricted profile mutation functions.
- Database constraints preventing account-type changes and duplicate contacts.

## Excluded

- Venue creation or approval.
- Venue browsing data.
- Booking, payment, Razorpay, refunds, or commission logic.
- Custom admin panel.

## Security gates

- Server code validates identity with signed Supabase claims or a fresh user lookup.
- `getSession()` is not used for authorization decisions.
- Client code cannot insert or change account type.
- Client code cannot insert or modify admin access.
- Profile updates go through whitelisted database functions.
- Protected Player and Owner route trees verify account type on the server.

## Testing checklist

- Unauthenticated `/app` access redirects to `/login`.
- Player sessions cannot open Owner routes.
- Owner sessions cannot open Player routes.
- Existing users cannot sign in under a different account type.
- Email link, phone OTP, Google callback, logout, and session refresh paths work.
- Profile completion requirements differ correctly by account type.
- RLS exposes only the signed-in user’s profile.
- Production build, lint, and TypeScript pass without secrets.

## External connections required

- Supabase project URL and publishable key.
- Supabase migration applied to the project.
- Google OAuth client ID and secret configured in Supabase.
- Twilio Verify credentials configured in Supabase.
- Production SMTP before public beta.

## Implementation result

- Supabase clients initialize lazily so builds remain safe without credentials.
- `src/proxy.ts` refreshes sessions and redirects unauthenticated protected requests.
- Protected Server Component layouts independently verify signed claims and account type.
- OTP and Google callbacks create or recover the immutable profile through a restricted RPC.
- Onboarding enforces different Player and Venue Owner completion rules.
- Direct client mutation of account type, admin access, and audit records is denied.
- Local lint, type checking, production build, desktop browser QA, and 390px mobile QA pass.
- Live OTP delivery, OAuth, and cloud RLS verification require the external setup in
  `docs/setup/supabase-auth.md`.
