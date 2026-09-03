# Pllayz Flutter app

The Flutter client is the Android and iOS companion to the hosted Pllayz web
app. It uses the same Supabase project, row-level security, Edge Functions,
Razorpay webhook confirmation, venue catalog, bookings, and opponent finder.
No service-role key or payment secret is bundled in the app.

## Features

- Email magic-link and Google authentication with Player/Owner role selection.
- Shared onboarding and editable profile.
- Player home, venue/city/sport discovery, live slots, ₹500 booking holds,
  Razorpay checkout, payment history, and confirmed bookings.
- Team matchmaking: publish a confirmed game, browse open opponents, join,
  share, or close a request.
- Owner dashboard, venue drafts, images, courts, supported sports, weekly
  availability, slot generation, block/unblock controls, review submission,
  booking demand, payments, commission records, and audit activity.
- Material 3 responsive navigation: bottom navigation on phones and a
  navigation rail on wider Android/iOS screens.

## Local setup

Flutter 3.44.8 or newer and Java 17 are recommended.

```sh
cd mobile
flutter pub get
flutter analyze
flutter test
```

Run with the public Supabase values from the root `.env.local`:

```sh
flutter run \
  --dart-define=SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --dart-define=SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  --dart-define=WEB_BASE_URL="https://pllayz-app.vercel.app"
```

The same defines are required for `flutter build apk --release`. Android release
builds use the local Pllayz signing certificate when
`PLLAYZ_ANDROID_STORE_PASSWORD` and `PLLAYZ_ANDROID_KEY_PASSWORD` are present.
Never commit a keystore, its password, a service-role key, or Razorpay secrets.

## Mobile authentication

Supabase redirects to
`https://pllayz-app.vercel.app/mobile-auth`, which is already covered by the
hosted redirect allow-list. Android App Links open `io.pllayz.app` directly.
The hosted page also falls back to the `io.pllayz.app://login-callback/` scheme
for iOS and Android browsers.

Magic links are one-time links. Request one link, then open only the newest
email on the same device that requested it.

## iOS

The iOS bundle identifier and URL scheme are `io.pllayz.app`. The shared Flutter
UI is responsive on iPhone and iPad. Producing an installable IPA requires full
Xcode, CocoaPods, an Apple Developer team, and a signing profile; those
Apple-controlled credentials are intentionally not stored in this repository.

## Android beta

The current signed universal APK is published as a GitHub Release asset:

<https://github.com/kominsiare/Sport_App/releases/download/pllayz-mobile-v1.0.0/Pllayz-Android-v1.0.0.apk>

Android may ask the tester to allow installs from their browser or file manager.
Future builds must use the same signing certificate to install as updates.
