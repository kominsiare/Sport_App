import type { AccountType, Profile } from "@/types/database";

export function isAccountType(value: string | null): value is AccountType {
  return value === "player" || value === "owner";
}

export function safeAppPath(value: string | null | undefined, fallback = "/app") {
  if (!value || !value.startsWith("/app") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function workspacePath(accountType: AccountType) {
  return accountType === "owner" ? "/app/owner" : "/app/player";
}

export function destinationForProfile(profile: Profile, requestedNext?: string | null) {
  if (!profile.profile_complete) {
    const params = new URLSearchParams({
      next: safeAppPath(requestedNext, workspacePath(profile.account_type)),
    });
    return `/onboarding?${params.toString()}`;
  }

  const safeNext = safeAppPath(requestedNext, workspacePath(profile.account_type));
  const allowedPrefix = `/app/${profile.account_type}`;

  if (safeNext === "/app" || safeNext.startsWith(allowedPrefix)) {
    return safeNext === "/app" ? workspacePath(profile.account_type) : safeNext;
  }

  return workspacePath(profile.account_type);
}
