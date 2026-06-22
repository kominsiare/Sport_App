"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HiArrowLeft,
  HiArrowRight,
  HiBuildingOffice2,
  HiEnvelope,
  HiExclamationTriangle,
  HiLockClosed,
  HiPhone,
  HiUserGroup,
} from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";

import { Brand } from "@/components/brand/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AuthProviderAvailability } from "@/lib/supabase/auth-settings";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types/database";

type Method = "phone" | "email";
type Stage = "identify" | "verify" | "link-sent";

const errorMessages: Record<string, string> = {
  account_type_conflict:
    "This contact already belongs to the other account type. Player and Venue Owner accounts stay separate.",
  contact_already_registered:
    "That verified contact is already connected to another Pllayz account.",
  connection_required:
    "Supabase is not connected yet. Add the project URL and publishable key to .env.local.",
  callback_failed:
    "That sign-in link is invalid, expired, or was opened outside the browser that requested it. Request a fresh email and try again.",
  oauth_failed: "Google sign-in could not be completed. Please try again.",
  session_missing:
    "Your sign-in session expired. Please request a fresh sign-in email.",
  profile_failed: "We could not prepare your Pllayz profile. Please try again.",
};

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

function readableAuthError(message: string) {
  if (message.toLowerCase().includes("rate limit")) {
    return "Too many attempts. Wait a moment before requesting another code.";
  }
  if (message.toLowerCase().includes("invalid")) {
    return "The code is invalid or expired. Request a new one and try again.";
  }
  return message;
}

export function LoginForm({
  nextPath = "/app",
  configured,
  providers,
  initialError,
}: {
  nextPath?: string;
  configured: boolean;
  providers: AuthProviderAvailability;
  initialError?: string;
}) {
  const [accountType, setAccountType] = useState<AccountType>("player");
  const [method, setMethod] = useState<Method>(
    providers.phone ? "phone" : "email",
  );
  const [stage, setStage] = useState<Stage>("identify");
  const [identifier, setIdentifier] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    initialError ? errorMessages[initialError] ?? initialError : "",
  );

  function resetVerification(nextMethod = method) {
    setMethod(nextMethod);
    setStage("identify");
    setOtp("");
    setMessage("");
  }

  async function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || !providers[method]) return;

    const normalized =
      method === "phone" ? normalizePhone(identifier) : identifier.trim().toLowerCase();

    if (!normalized) {
      setMessage("Enter a valid mobile number with country code, or a 10-digit Indian number.");
      return;
    }

    setBusy(true);
    setMessage("");

    const supabase = getBrowserSupabaseClient();
    const { error } =
      method === "phone"
        ? await supabase.auth.signInWithOtp({
            phone: normalized,
            options: {
              shouldCreateUser: true,
              data: { account_type: accountType },
            },
          })
        : await supabase.auth.signInWithOtp({
            email: normalized,
            options: {
              shouldCreateUser: true,
              emailRedirectTo: (() => {
                const callbackUrl = new URL("/auth/callback", window.location.origin);
                callbackUrl.searchParams.set("account_type", accountType);
                callbackUrl.searchParams.set("next", nextPath);
                return callbackUrl.toString();
              })(),
              data: { account_type: accountType },
            },
          });

    setBusy(false);

    if (error) {
      setMessage(readableAuthError(error.message));
      return;
    }

    setSentTo(normalized);
    setStage(method === "phone" ? "verify" : "link-sent");
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (method !== "phone" || otp.length !== 6 || !configured) return;

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: sentTo,
      token: otp,
      type: "sms",
    });

    if (error) {
      setBusy(false);
      setMessage(readableAuthError(error.message));
      return;
    }

    const params = new URLSearchParams({
      account_type: accountType,
      next: nextPath,
    });
    window.location.assign(`/auth/complete?${params.toString()}`);
  }

  async function continueWithGoogle() {
    if (!configured || !providers.google) return;

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("account_type", accountType);
    callbackUrl.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setBusy(false);
      setMessage(readableAuthError(error.message));
    }
  }

  return (
    <main className="night-grid min-h-dvh px-4 py-6 md:grid md:place-items-center md:py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between">
          <Brand compact />
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
          >
            <HiArrowLeft className="size-4" />
            Home
          </Link>
        </div>

        <Card className="blue-glow mt-10 border-primary/35 bg-[#071020]/95 p-5 md:p-7">
          <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-accent">
            <HiLockClosed className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">Enter the Pllayz arena</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Select the account you want to use. This choice is permanent so player and
            venue permissions never get mixed.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {(
              [
                { value: "player", label: "Player", icon: HiUserGroup },
                { value: "owner", label: "Venue owner", icon: HiBuildingOffice2 },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  disabled={stage !== "identify" || busy}
                  onClick={() => {
                    setAccountType(item.value);
                    setMessage("");
                  }}
                  className={cn(
                    "focus-ring flex min-h-14 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition",
                    accountType === item.value
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 rounded-xl border border-border bg-background p-1">
            {(["phone", "email"] as Method[]).map((item) => (
              <button
                key={item}
                type="button"
                disabled={stage !== "identify" || busy || !providers[item]}
                onClick={() => resetVerification(item)}
                className={cn(
                  "focus-ring flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold capitalize text-muted-foreground transition disabled:cursor-not-allowed disabled:opacity-45",
                  method === item && "bg-secondary text-foreground",
                )}
              >
                {item === "phone" ? (
                  <HiPhone className="size-4" />
                ) : (
                  <HiEnvelope className="size-4" />
                )}
                {item === "phone" ? "Phone OTP" : "Email link"}
              </button>
            ))}
          </div>

          {message ? (
            <div
              role="alert"
              className="mt-4 flex gap-3 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100"
            >
              <HiExclamationTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}

          {stage === "identify" ? (
            <form className="mt-5" onSubmit={sendCode}>
              <label className="text-sm font-medium" htmlFor="login-identifier">
                {method === "phone" ? "Mobile number" : "Email address"}
              </label>
              <Input
                id="login-identifier"
                className="mt-2"
                type={method === "phone" ? "tel" : "email"}
                inputMode={method === "phone" ? "tel" : "email"}
                autoComplete={method === "phone" ? "tel" : "email"}
                placeholder={method === "phone" ? "+91 98765 43210" : "you@example.com"}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                disabled={!configured || busy}
                required
              />
              <Button
                type="submit"
                className="mt-4 w-full"
                size="lg"
                disabled={!configured || busy}
              >
                {busy
                  ? method === "phone"
                    ? "Sending code…"
                    : "Sending link…"
                  : method === "phone"
                    ? "Send one-time code"
                    : "Send secure sign-in link"}
                {!busy ? <HiArrowRight className="size-5" /> : null}
              </Button>
            </form>
          ) : stage === "verify" ? (
            <form className="mt-5" onSubmit={verifyCode}>
              <p className="text-sm font-medium">Enter the six-digit code</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Sent to {sentTo}.
              </p>
              <OtpInput
                key={`${method}-${sentTo}`}
                className="mt-4"
                onChange={setOtp}
                disabled={busy}
              />
              <Button
                type="submit"
                className="mt-4 w-full"
                size="lg"
                disabled={otp.length !== 6 || busy}
              >
                {busy ? "Verifying…" : "Verify and continue"}
                {!busy ? <HiArrowRight className="size-5" /> : null}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 px-0 text-muted-foreground"
                disabled={busy}
                onClick={() => resetVerification()}
              >
                Change {method === "phone" ? "number" : "email"}
              </Button>
            </form>
          ) : (
            <div className="mt-5">
              <span className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent">
                <HiEnvelope className="size-5" />
              </span>
              <h2 className="mt-4 font-semibold">Check your email</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We sent a secure, one-use sign-in link to {sentTo}. Open it in
                this browser to continue.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 text-muted-foreground"
                disabled={busy}
                onClick={() => resetVerification("email")}
              >
                Change email or resend
              </Button>
            </div>
          )}

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={!configured || !providers.google || busy || stage !== "identify"}
            onClick={continueWithGoogle}
          >
            <FcGoogle className="size-5" />
            Continue with Google
            {!providers.google ? (
              <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Setup required
              </span>
            ) : null}
          </Button>

          <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">
            Google players can browse after profile setup, but a verified phone is required
            before booking.
          </p>
        </Card>
      </div>
    </main>
  );
}
