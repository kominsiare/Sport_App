import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Brand } from "@/components/brand/brand";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { safeAppPath, workspacePath } from "@/lib/auth/navigation";
import { getCurrentAccount } from "@/lib/auth/server";
import { getAuthProviderAvailability } from "@/lib/supabase/auth-settings";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Complete your profile",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=connection_required");
  }

  const account = await getCurrentAccount();
  if (!account) redirect("/login?error=session_missing");
  if (!account.profile) redirect("/login?error=profile_failed");

  const params = await searchParams;
  const requestedNext = safeAppPath(params.next);
  const workspace = workspacePath(account.profile.account_type);
  const accountPrefix = `/app/${account.profile.account_type}`;
  const nextPath =
    requestedNext === "/app"
      ? workspace
      : requestedNext.startsWith(accountPrefix)
        ? requestedNext
        : workspace;

  if (account.profile.profile_complete) {
    redirect(nextPath);
  }

  const providers = await getAuthProviderAvailability();

  return (
    <main className="arena-surface min-h-dvh px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="focus-ring rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Secure account setup
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Complete your Pllayz profile
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your verified contacts control what the account can do. They are never used
            to switch between Player and Venue Owner access.
          </p>
        </div>

        <div className="mt-8">
          <OnboardingForm
            initialProfile={account.profile}
            nextPath={nextPath}
            providers={providers}
          />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Need to start again?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Return to login
          </Link>
        </p>
      </div>
    </main>
  );
}
