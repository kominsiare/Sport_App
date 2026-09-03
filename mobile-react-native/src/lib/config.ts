const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const appConfig = {
  supabaseUrl,
  supabaseKey,
  webUrl:
    process.env.EXPO_PUBLIC_WEB_URL?.trim() ||
    "https://pllayz-app.onrender.com",
  authRedirectUrl:
    process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim() ||
    "https://pllayz-app.onrender.com/mobile-auth",
  isConfigured: Boolean(supabaseUrl && supabaseKey),
};
