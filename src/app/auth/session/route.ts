import { NextResponse, type NextRequest } from "next/server";

import {
  destinationForProfile,
  isAccountType,
  safeAppPath,
} from "@/lib/auth/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SessionPayload = {
  access_token?: unknown;
  account_type?: unknown;
  next?: unknown;
  refresh_token?: unknown;
};

function profileError(message: string) {
  if (message.includes("account_type_conflict")) return "account_type_conflict";
  if (message.includes("contact_already_registered")) {
    return "contact_already_registered";
  }
  return "profile_failed";
}

function jsonError(error: string, next: string, status = 400) {
  const params = new URLSearchParams({ error, next });
  return NextResponse.json(
    { error, redirectTo: `/login?${params.toString()}` },
    { status },
  );
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return jsonError("connection_required", "/app", 503);
  }

  let payload: SessionPayload;
  try {
    payload = (await request.json()) as SessionPayload;
  } catch {
    return jsonError("callback_failed", "/app");
  }

  const next = safeAppPath(
    typeof payload.next === "string" ? payload.next : undefined,
  );
  const accountType =
    typeof payload.account_type === "string" ? payload.account_type : null;
  const accessToken =
    typeof payload.access_token === "string" ? payload.access_token : null;
  const refreshToken =
    typeof payload.refresh_token === "string" ? payload.refresh_token : null;

  if (!accessToken || !refreshToken || !isAccountType(accountType)) {
    return jsonError("callback_failed", next);
  }

  const supabase = await createServerSupabaseClient();
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return jsonError("callback_failed", next);
  }

  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims.sub) {
    return jsonError("session_missing", next);
  }

  const { data: profile, error } = await supabase.rpc("ensure_my_profile", {
    p_account_type: accountType,
  });

  if (error || !profile) {
    await supabase.auth.signOut();
    return jsonError(profileError(error?.message ?? ""), next);
  }

  return NextResponse.json({
    redirectTo: destinationForProfile(profile, next),
  });
}
