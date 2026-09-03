# Pllayz React Native

The native iOS and Android client for Pllayz, built with Expo SDK 57,
React Native, Expo Router, Supabase, and the same backend used by the web app.

## Included flows

- Email-link authentication with persisted PKCE sessions and native deep links.
- Player onboarding, venue discovery, live slots, booking holds, activity, and profile.
- Razorpay checkout in a controlled in-app WebView; only the signed backend webhook
  confirms a booking.
- Team opponent finder for hosting, finding, joining, and cancelling match requests
  without creating a second booking or payment.
- Owner onboarding, dashboard, venues, courts, sports, weekly rules, generated slots,
  blocked slots, review submission, bookings, payments, and commission ledger.
- Responsive phone and tablet layouts with motion, safe areas, and accessible touch
  targets.

## Configuration

Copy `.env.example` to `.env.local` and set:

```text
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
EXPO_PUBLIC_WEB_URL=https://pllayz-app.onrender.com
EXPO_PUBLIC_AUTH_REDIRECT_URL=https://pllayz-app.onrender.com/mobile-auth
```

Only a Supabase publishable key belongs in this client. Never put the service-role key,
Razorpay secret, or webhook secret in an Expo environment variable.

The hosted callback and `io.pllayz.app://login-callback/` must both be present in
Supabase Auth's redirect allow-list. Android app-link fingerprints live in
`public/.well-known/assetlinks.json` in the web project.

## Development

Install the pinned dependencies:

```bash
pnpm install --frozen-lockfile
```

Start Expo:

```bash
pnpm start
```

Useful platform commands:

```bash
pnpm android
pnpm ios
pnpm web
```

The app routes are under `src/app`; shared backend access is in
`src/lib/repository.ts`.

## Verification

Run all source and bundle checks from this directory:

```bash
pnpm typecheck
pnpm lint
pnpm dlx expo-doctor@latest --verbose
pnpm export:android
```

No verification step should initiate a Razorpay payment. Validate payment status from
existing records or disposable backend fixtures only.

## Android tester APK

Generate native Android files and a standalone release build:

```bash
pnpm exec expo prebuild --platform android
cd android
NODE_ENV=production ./gradlew assembleRelease
```

The APK is written to:

```text
android/app/build/outputs/apk/release/app-release.apk
```

The locally shared tester APK is signed with the generated debug certificate. Use EAS
credentials or a protected Play signing keystore before publishing to an app store.

## Authentication and payments

- Request the sign-in email in Pllayz and open only the newest link on that same phone.
- The Render `/mobile-auth` page preserves the complete callback query and fragment,
  then returns to the native URL scheme.
- Razorpay order creation and verification stay server-side. A Checkout success event
  places the app in a syncing state; only the signed Supabase webhook can convert the
  hold into a confirmed booking.
- Once an order exists, the hold cannot be cancelled from the client and the payment is
  never started twice.
