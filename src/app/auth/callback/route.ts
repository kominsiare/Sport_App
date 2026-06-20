import { NextResponse, type NextRequest } from "next/server";

import {
  destinationForProfile,
  isAccountType,
  safeAppPath,
} from "@/lib/auth/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function loginError(request: NextRequest, error: string, next: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

function profileError(message: string) {
  if (message.includes("account_type_conflict")) return "account_type_conflict";
  if (message.includes("contact_already_registered")) {
    return "contact_already_registered";
  }
  return "profile_failed";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const accountType = request.nextUrl.searchParams.get("account_type");
  const next = safeAppPath(request.nextUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return loginError(request, "connection_required", next);
  }

  if (!code || !isAccountType(accountType)) {
    return loginError(request, "callback_failed", next);
  }

  const supabase = await createServerSupabaseClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return loginError(request, "callback_failed", next);
  }

  const { data: profile, error } = await supabase.rpc("ensure_my_profile", {
    p_account_type: accountType,
  });

  if (error || !profile) {
    await supabase.auth.signOut();
    return loginError(request, profileError(error?.message ?? ""), next);
  }

  return NextResponse.redirect(
    new URL(destinationForProfile(profile, next), request.url),
  );
}
