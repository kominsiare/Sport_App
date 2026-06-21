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

## Live Supabase verification

**Project:** `pllayz` (`ap-south-1`)
**Verified:** 2026-06-20

- Module 2 migration applied successfully through the Supabase SQL Editor.
- `profiles` exists with RLS enabled.
- `ensure_my_profile(text)` exists.
- One self-select profile policy exists.
- Anonymous users cannot select `profiles`, `admin_users`, or `auth_audit_logs`.
- Authenticated clients have profile select permission but no direct insert permission.
- Anonymous execution of `ensure_my_profile` returns `authentication_required`.
- Local site URL and `/auth/callback` redirect URL are configured.
- The local ignored `.env.local` points to the project with the exact web publishable key.
- Supabase reports Email enabled; Phone and Google remain disabled until their external
  provider credentials are supplied.
- Connected lint, TypeScript, and production build pass.
- A real email sign-in completed the PKCE callback and created a persistent session.
- The profile RPC created the Player profile and redirected to onboarding.
- Player onboarding completed and unlocked `/app/player` and `/app/player/venues`.
- An invalid or previously consumed link is rejected and now shows a specific recovery
  message instead of a Google-specific OAuth error.
- Manual verification confirmed the Player session remained usable after the local
  development server restarted.
- Manual verification confirmed the Player account does not gain access to the Owner
  workspace.

## Remaining provider-gated checks

- Configure custom SMTP, change the email template to use `{{ .Token }}`, and verify
  six-digit email OTP delivery.
- Configure Twilio Verify and verify phone OTP delivery.
- Configure a Google OAuth web client and verify its callback.
- Run Venue Owner onboarding with a separate real contact.
