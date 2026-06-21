import { redirect } from "next/navigation";

import { destinationForProfile, workspacePath } from "@/lib/auth/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AccountType, Profile } from "@/types/database";

export type CurrentAccount = {
  userId: string;
  profile: Profile | null;
};

export async function getCurrentAccount(): Promise<CurrentAccount | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (!userId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load the signed-in profile: ${error.message}`);
  }

  return { userId, profile };
}

export async function requireCompleteProfile(): Promise<Profile> {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/login?next=/app");
  }

  if (!account.profile) {
    redirect("/onboarding?next=/app");
  }

  if (!account.profile.profile_complete) {
    redirect(destinationForProfile(account.profile, "/app"));
  }

  return account.profile;
}

export async function requireAccountType(accountType: AccountType) {
  const profile = await requireCompleteProfile();

  if (profile.account_type !== accountType) {
    redirect(workspacePath(profile.account_type));
  }

  return profile;
}
