# Module 2 Auth QA

**Date:** 2026-06-20  
**Branch:** `rahulevol/module-2-auth`  
**Rollback tag:** `module-1-complete`

## Automated checks

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run build` — pass without Supabase credentials
- `git diff --check` — pass
- committed-file secret scan — pass

## Browser checks

Verified on the local Next.js development server:

- `/login` renders meaningful content with no framework error overlay.
- Supabase-dependent controls are disabled when credentials are absent.
- Player and Venue Owner account selection is interactive.
- `/app` redirects to `/login?error=connection_required` when Supabase is not connected.
- Desktop viewport has no console warnings or errors.
- 390 × 844 mobile viewport has no horizontal overflow.
- Login screen keeps the existing Night Match visual system at both sizes.

## Security review

- Protected routes do not rely on the proxy alone.
- `/app`, `/app/player`, and `/app/owner` re-check identity and profile on the server.
- Player sessions are redirected away from Owner routes and vice versa.
- Account type is immutable in PostgreSQL and cannot be directly written by clients.
- Profile updates are limited to whitelisted database functions.
- `admin_users` and `auth_audit_logs` have RLS enabled with no client mutation grants.
- Only the signed-in user can select their own profile.
- Duplicate verified email or phone contacts are rejected.

## Requires connected services

The following checks cannot run without a Supabase project and provider credentials:

- phone OTP delivery through Twilio Verify,
- email OTP delivery and production SMTP,
- Google OAuth callback,
- cloud migration execution,
- live RLS tests with separate Player and Venue Owner users,
- session refresh across browser restarts.

Run these checks after completing `docs/setup/supabase-auth.md`.
