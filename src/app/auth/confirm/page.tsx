"use client";

import { useEffect, useState } from "react";

import { Brand } from "@/components/brand/brand";
import { Card } from "@/components/ui/card";

function loginUrl(error: string, next: string) {
  const params = new URLSearchParams({ error, next });
  return `/login?${params.toString()}`;
}

function readHashSession() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

export default function AuthConfirmPage() {
  const [message, setMessage] = useState("Completing your secure sign-in…");

  useEffect(() => {
    async function completeSignIn() {
      const url = new URL(window.location.href);
      const accountType = url.searchParams.get("account_type") ?? "";
      const next = url.searchParams.get("next") ?? "/app";
      const hashSession = readHashSession();

      window.history.replaceState(null, "", `${url.pathname}${url.search}`);

      if (!hashSession || !accountType) {
        window.location.replace(loginUrl("callback_failed", next));
        return;
      }

      try {
        const response = await fetch("/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: hashSession.accessToken,
            account_type: accountType,
            next,
            refresh_token: hashSession.refreshToken,
          }),
        });
        const payload = (await response.json()) as {
          error?: string;
          redirectTo?: string;
        };

        window.location.replace(
          payload.redirectTo ?? loginUrl(payload.error ?? "callback_failed", next),
        );
      } catch {
        setMessage("We could not complete sign-in. Sending you back to login…");
        window.location.replace(loginUrl("callback_failed", next));
      }
    }

    void completeSignIn();
  }, []);

  return (
    <main className="night-grid grid min-h-dvh place-items-center px-4 py-10">
      <Card className="blue-glow w-full max-w-md border-primary/35 bg-card/95 p-6 text-center">
        <div className="mx-auto flex justify-center">
          <Brand compact />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Signing you in</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
      </Card>
    </main>
  );
}
