"use client";

import Link from "next/link";
import { useState } from "react";
import { HiArrowLeft, HiArrowRight, HiEnvelope, HiLockClosed, HiPhone } from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";

import { Brand } from "@/components/brand/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { cn } from "@/lib/utils";

type Method = "phone" | "email";

export function LoginForm({ nextPath = "/app" }: { nextPath?: string }) {
  const [method, setMethod] = useState<Method>("phone");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

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
          <h1 className="mt-5 text-2xl font-bold tracking-tight">Log in to Pllayz</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Venue browsing is available only after authentication. Real OTP and Google
            login will connect in Module 2.
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-xl border border-border bg-background p-1">
            {(["phone", "email"] as Method[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMethod(item);
                  setOtpSent(false);
                  setVerified(false);
                }}
                className={cn(
                  "focus-ring flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold capitalize text-muted-foreground transition",
                  method === item && "bg-secondary text-foreground",
                )}
              >
                {item === "phone" ? (
                  <HiPhone className="size-4" />
                ) : (
                  <HiEnvelope className="size-4" />
                )}
                {item}
              </button>
            ))}
          </div>

          {!otpSent ? (
            <form
              className="mt-5"
              onSubmit={(event) => {
                event.preventDefault();
                setOtpSent(true);
              }}
            >
              <label className="text-sm font-medium" htmlFor="login-identifier">
                {method === "phone" ? "Mobile number" : "Email address"}
              </label>
              <Input
                id="login-identifier"
                className="mt-2"
                type={method === "phone" ? "tel" : "email"}
                inputMode={method === "phone" ? "tel" : "email"}
                placeholder={method === "phone" ? "+91 98765 43210" : "you@example.com"}
                required
              />
              <Button type="submit" className="mt-4 w-full" size="lg">
                Send one-time code
                <HiArrowRight className="size-5" />
              </Button>
            </form>
          ) : !verified ? (
            <div className="mt-5">
              <p className="text-sm font-medium">Enter the six-digit code</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This is an interactive UI preview; no message was sent.
              </p>
              <OtpInput className="mt-4" onComplete={() => setVerified(true)} />
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 text-muted-foreground"
                onClick={() => setOtpSent(false)}
              >
                Change {method === "phone" ? "number" : "email"}
              </Button>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-accent/30 bg-accent/10 p-4">
              <p className="text-sm font-semibold text-accent">Preview verified</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                No real session was created. Continue only to inspect the protected-shell
                placeholder.
              </p>
              <Link
                href={nextPath}
                className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
              >
                Open shell preview
                <HiArrowRight className="size-4" />
              </Link>
            </div>
          )}

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" disabled>
            <FcGoogle className="size-5" />
            Continue with Google
            <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Module 2
            </span>
          </Button>

          <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">
            By continuing, you agree to the future Pllayz terms and privacy policy.
          </p>
        </Card>
      </div>
    </main>
  );
}
