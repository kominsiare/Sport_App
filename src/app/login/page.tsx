import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { destinationForProfile, safeAppPath } from "@/lib/auth/navigation";
import { getCurrentAccount } from "@/lib/auth/server";
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
      initialError={params.error}
    />
  );
}
