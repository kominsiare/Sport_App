# Flutter mobile QA

Date: 2026-07-25

App version: 1.0.0 (1)

Application/bundle ID: `io.pllayz.app`

## Scope

The Flutter client was checked against the current Pllayz Player and Owner web
flows. It reads and mutates the same RLS-protected Supabase records and invokes
the existing Razorpay Edge Functions. No service-role credential is included.

## Automated checks

- Flutter 3.44.8 / Dart 3.12.2.
- `dart format lib test`: clean.
- `flutter analyze`: no issues.
- `flutter test`: all tests passed.
- Android release build: passed against compile/target SDK 36, minimum SDK 24.
- `apksigner verify`: passed with APK Signature Scheme v2 and one Pllayz signer.
- iOS `Info.plist`: `plutil -lint` passed.
- Web ESLint, TypeScript, and Next.js production build passed after excluding
  generated Flutter output from the web linter.

## Android device QA

Device: Pixel 7 Android 14 emulator (API 34, arm64).

- Fresh install and update install both succeeded.
- Cold launch succeeded with no Flutter, AndroidRuntime, or unhandled exception
  entries in Logcat.
- Login was visually checked at 390dp width: no horizontal overflow, clipped
  actions, unreadable labels, or inaccessible trust information.
- Keyboard-open login remained vertically scrollable.
- App icon, adaptive icon, and native splash were generated from Pllayz assets.
- The production domain association returned the release certificate and
  Android reported `pllayz-app.vercel.app: verified`.
- An unscoped Android VIEW intent to
  `https://pllayz-app.vercel.app/mobile-auth` opened
  `io.pllayz.app/.MainActivity`, proving the hosted email handoff reaches the
  installed app.

## Auth incident and resolution

The first mobile test email was verified successfully by Supabase. A second open
of the same URL returned `One-time token not found`, which is expected for an
already-consumed magic link. At that moment the production `/mobile-auth`
handoff had not yet been deployed, so the verified session could not return to
the APK.

The handoff and Android Digital Asset Links file were then deployed to
<https://pllayz-app.vercel.app>. Production now returns HTTP 200 for
`/mobile-auth`, and Android verifies and opens that domain in Pllayz. Testers
must request one fresh email after installing the current APK and open only the
newest link on the same phone.

## Functional coverage

- Player: venue filters, venue detail, future slots, booking hold create/cancel,
  Razorpay order creation, explicit checkout launch, signed return verification,
  webhook-waiting state, holds/payments/bookings history.
- Matchmaking: confirmed-game publishing, open feed, opponent join, share, and
  host close action.
- Owner: dashboard metrics, venue create/edit/draft delete, primary image,
  courts and supported sports, weekly rules, slot refresh, slot block/unblock,
  review submission, holds, bookings, payment states, commission, and operation
  logs.
- Profile: role-aware details, email state, profile editing, and sign-out.

No payment was initiated during Flutter QA. The previously verified data was
left unchanged:

- Razorpay order `order_T4cWh1BxpWqGKc`
- Razorpay payment `pay_T4d4BTQ3AC5fJf`
- Booking `1492da94-c756-4416-bf9e-37e0cca5d8cc`

## APK

- File: `Pllayz-Android-v1.0.0.apk`
- Universal APK size: approximately 60.8 MB.
- SHA-256:
  `7f942ee247345fb9b9f341bc5fc016a1aa119003717ab56d1941fa7b34279f1c`
- Download:
  <https://github.com/kominsiare/Sport_App/releases/download/pllayz-mobile-v1.0.0/Pllayz-Android-v1.0.0.apk>

## iOS boundary

The same responsive Dart UI, Supabase data layer, Razorpay integration, custom
URL scheme, icons, and splash assets are present under `mobile/ios`. This
machine has only Apple Command Line Tools, so an IPA could not be compiled or
signed. A signed iOS distribution build requires full Xcode, CocoaPods, and the
user's Apple Developer credentials.
