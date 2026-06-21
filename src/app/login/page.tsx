import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { destinationForProfile, safeAppPath } from "@/lib/auth/navigation";
import { getCurrentAccount } from "@/lib/auth/server";
import { getAuthProviderAvailability } from "@/lib/supabase/auth-settings";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const safeNext = safeAppPath(params.next);
  const configured = isSupabaseConfigured();
  const providers = await getAuthProviderAvailability();

  if (configured) {
    const account = await getCurrentAccount();
    if (account?.profile) {
      redirect(destinationForProfile(account.profile, safeNext));
    }
  }

  return (
    <LoginForm
      nextPath={safeNext}
      configured={configured}
      providers={providers}
      initialError={params.error}
    />
  );
}
