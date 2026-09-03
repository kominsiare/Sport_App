# React Native mobile verification

Verified on 2026-09-03 from `mobile-react-native/`.

## Scope

The Expo/React Native client shares the hosted Supabase and Razorpay backend with the
Next.js application. It includes:

- Player login, onboarding, venue discovery, slot selection, booking holds, Razorpay
  checkout, booking/payment activity, opponent matchmaking, and profile.
- Owner login, onboarding, dashboard, venue/court/sport editing, weekly availability,
  slot generation and blocking, review submission, booking/payment activity, fees,
  and profile.
- Adaptive phone/tablet presentation, animated entry states, safe-area handling, and
  the current Pllayz visual system.

No payment, booking hold, matchmaking post, or other production data was created or
changed during this verification. The existing captured payment and booking were left
untouched.

## Automated checks

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm dlx expo-doctor@latest --verbose`: 21/21 checks passed.
- `pnpm export:android`: passed; 1,828 modules bundled for Android.
- `NODE_ENV=production ./gradlew assembleRelease --no-daemon`: passed.
- Android package: `io.pllayz.app`.
- Version: `1.0.0` (`versionCode 1`).
- Minimum Android SDK: 24.
- Target Android SDK: 36.
- Release APK contains the embedded Hermes `index.android.bundle` and does not
  require localhost, Metro, or Expo Go.

## Device smoke test

The standalone release APK was installed on a Pixel 7 Android 14 emulator.

- Installation: passed.
- Cold launch into `io.pllayz.app/.MainActivity`: passed.
- Unauthenticated login layout at phone width: passed with no horizontal overflow,
  clipping, unreadable text, or blocked primary action.
- Custom callback `io.pllayz.app://login-callback/`: delivered to the running app.
- Fatal Android, native, and React Native JavaScript logs after launch: none.

A real email was not requested, so Supabase rate limits and one-time links were not
consumed.

## Authentication configuration

The APK is built with:

```text
EXPO_PUBLIC_WEB_URL=https://pllayz-app.onrender.com
EXPO_PUBLIC_AUTH_REDIRECT_URL=https://pllayz-app.onrender.com/mobile-auth
```

The Render home and `/mobile-auth` endpoints returned HTTP 200 during verification.
Supabase project `mljvwgboykoynsdqhhvl` was `ACTIVE_HEALTHY`; its public Auth
settings reported Email enabled, Phone disabled, and Google disabled.

For native email sign-in, Supabase Auth's redirect allow-list must include both
`https://pllayz-app.onrender.com/**` and `io.pllayz.app://**`. Request and open only
the newest email link on the same phone.

## Tester APK

Local artifact:

```text
mobile-react-native/android/app/build/outputs/apk/release/app-release.apk
```

Build size: approximately 105 MiB (universal APK).

SHA-256:

```text
c57b155861d5168a51d4e5c1f1dc9f8c4f7235e95c73c4baa79a0498fdd662c2
```

This tester APK is signed with the generated Android debug certificate. Replace it with
a protected release/Play signing key before store distribution.
