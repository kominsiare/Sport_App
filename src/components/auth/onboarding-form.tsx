"use client";

import { useState } from "react";
import {
  HiArrowRight,
  HiBuildingOffice2,
  HiCheckCircle,
  HiEnvelope,
  HiExclamationTriangle,
  HiMapPin,
  HiPhone,
  HiUser,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AuthProviderAvailability } from "@/lib/supabase/auth-settings";
import type { Profile, TricityCity } from "@/types/database";

const cities: TricityCity[] = ["Chandigarh", "Mohali", "Panchkula"];

type ContactKind = "phone" | "email";

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

function detailsComplete(profile: Profile) {
  return Boolean(
    profile.full_name &&
      profile.city &&
      (profile.account_type === "player" || profile.business_name),
  );
}

export function OnboardingForm({
  initialProfile,
  nextPath,
  providers,
}: {
  initialProfile: Profile;
  nextPath: string;
  providers: AuthProviderAvailability;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [businessName, setBusinessName] = useState(
    initialProfile.business_name ?? "",
  );
  const [city, setCity] = useState<TricityCity | "">(initialProfile.city ?? "");
  const [phone, setPhone] = useState(initialProfile.phone ?? "");
  const [email, setEmail] = useState(initialProfile.email ?? "");
  const [pendingContact, setPendingContact] = useState<{
    kind: ContactKind;
    value: string;
  } | null>(null);
  const [contactOtp, setContactOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  async function reloadProfile() {
    const supabase = getBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile.id)
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  }

  async function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!city) {
      setMessage("Choose Chandigarh, Mohali, or Panchkula.");
      return;
    }

    setBusy(true);
    setMessage("");
    setSuccess("");
    const supabase = getBrowserSupabaseClient();
    const { data, error } = await supabase.rpc("update_my_profile", {
      p_full_name: fullName,
      p_city: city,
      p_business_name: profile.account_type === "owner" ? businessName : null,
    });
    setBusy(false);

    if (error || !data) {
      setMessage(error?.message ?? "Profile details could not be saved.");
      return;
    }

    setProfile(data);
    setSuccess("Profile details saved.");
  }

  async function requestContactCode(kind: ContactKind) {
    const value =
      kind === "phone" ? normalizePhone(phone) : email.trim().toLowerCase();

    if (!value) {
      setMessage(
        kind === "phone"
          ? "Enter a valid mobile number with country code, or a 10-digit Indian number."
          : "Enter a valid email address.",
      );
      return;
    }

    setBusy(true);
    setMessage("");
    setSuccess("");
    const supabase = getBrowserSupabaseClient();
    const { error } =
      kind === "phone"
        ? await supabase.auth.updateUser({ phone: value })
        : await supabase.auth.updateUser({ email: value });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPendingContact({ kind, value });
    setContactOtp("");
    setSuccess(`A verification code was sent to ${value}.`);
  }

  async function verifyContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingContact || contactOtp.length !== 6) return;

    setBusy(true);
    setMessage("");
    setSuccess("");
    const supabase = getBrowserSupabaseClient();
    const { error } =
      pendingContact.kind === "phone"
        ? await supabase.auth.verifyOtp({
            phone: pendingContact.value,
            token: contactOtp,
            type: "phone_change",
          })
        : await supabase.auth.verifyOtp({
            email: pendingContact.value,
            token: contactOtp,
            type: "email_change",
          });

    if (error) {
      setBusy(false);
      setMessage(error.message);
      return;
    }

    try {
      const refreshed = await reloadProfile();
      setPhone(refreshed.phone ?? phone);
      setEmail(refreshed.email ?? email);
      setPendingContact(null);
      setContactOtp("");
      setSuccess(
        `${pendingContact.kind === "phone" ? "Mobile number" : "Email"} verified.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh profile.");
    } finally {
      setBusy(false);
    }
  }

  const owner = profile.account_type === "owner";
  const detailStatus = detailsComplete(profile);
  const phoneVerified = Boolean(profile.phone_verified_at);
  const emailVerified = Boolean(profile.email_verified_at);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
      <Card className="p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-accent">
            {owner ? (
              <HiBuildingOffice2 className="size-5" />
            ) : (
              <HiUser className="size-5" />
            )}
          </span>
          <div>
            <h2 className="font-semibold">
              {owner ? "Venue Owner profile" : "Player profile"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Account type is fixed. These details can be updated later.
            </p>
          </div>
          {detailStatus ? (
            <HiCheckCircle className="ml-auto size-5 text-accent" aria-label="Complete" />
          ) : null}
        </div>

        <form className="mt-6 grid gap-4" onSubmit={saveDetails}>
          <div>
            <label className="text-sm font-medium" htmlFor="full-name">
              Full name
            </label>
            <Input
              id="full-name"
              className="mt-2"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={busy}
              required
            />
          </div>

          {owner ? (
            <div>
              <label className="text-sm font-medium" htmlFor="business-name">
                Business or venue group name
              </label>
              <Input
                id="business-name"
                className="mt-2"
                autoComplete="organization"
                minLength={2}
                maxLength={140}
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                disabled={busy}
                required
              />
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium" htmlFor="city">
              Tricity location
            </label>
            <div className="relative mt-2">
              <HiMapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="city"
                value={city}
                onChange={(event) => setCity(event.target.value as TricityCity)}
                disabled={busy}
                required
                className="focus-ring h-12 w-full appearance-none rounded-xl border border-input bg-[#071020] pl-11 pr-4 text-sm text-foreground transition hover:border-[#344666] focus:border-primary"
              >
                <option value="">Choose city</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save profile details"}
          </Button>
        </form>
      </Card>

      <div className="grid content-start gap-5">
        <Card className="p-5 md:p-6">
          <h2 className="font-semibold">Verified contacts</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {owner
              ? "Owners need both a verified mobile number and email."
              : "One verified contact unlocks browsing. A verified phone unlocks booking."}
          </p>

          <div className="mt-5 grid gap-4">
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-3">
                <HiPhone className="size-5 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Mobile number</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.phone ?? "Not connected"}
                  </p>
                </div>
                {phoneVerified ? (
                  <span className="text-xs font-semibold text-accent">Verified</span>
                ) : null}
              </div>
              {!phoneVerified && !providers.phone ? (
                <p className="mt-4 text-xs leading-5 text-amber-200">
                  Mobile verification is unavailable until Twilio Verify is
                  configured for this environment.
                </p>
              ) : !phoneVerified && pendingContact?.kind !== "phone" ? (
                <div className="mt-4 grid gap-3">
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    disabled={busy}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => requestContactCode("phone")}
                  >
                    Send mobile verification
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-3">
                <HiEnvelope className="size-5 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Email address</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.email ?? "Not connected"}
                  </p>
                </div>
                {emailVerified ? (
                  <span className="text-xs font-semibold text-accent">Verified</span>
                ) : null}
              </div>
              {!emailVerified && !providers.email ? (
                <p className="mt-4 text-xs leading-5 text-amber-200">
                  Email verification is unavailable in this environment.
                </p>
              ) : !emailVerified && pendingContact?.kind !== "email" ? (
                <div className="mt-4 grid gap-3">
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={busy}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => requestContactCode("email")}
                  >
                    Send email verification
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {pendingContact ? (
            <form
              className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4"
              onSubmit={verifyContact}
            >
              <p className="text-sm font-medium">
                Verify {pendingContact.kind === "phone" ? "mobile" : "email"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter the six-digit code sent to {pendingContact.value}.
              </p>
              <OtpInput
                key={`${pendingContact.kind}-${pendingContact.value}`}
                className="mt-4"
                onChange={setContactOtp}
                disabled={busy}
              />
              <Button
                type="submit"
                className="mt-4 w-full"
                disabled={contactOtp.length !== 6 || busy}
              >
                {busy ? "Verifying…" : "Verify contact"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 px-0 text-muted-foreground"
                disabled={busy}
                onClick={() => {
                  setPendingContact(null);
                  setContactOtp("");
                }}
              >
                Cancel
              </Button>
            </form>
          ) : null}
        </Card>

        {message ? (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-xs leading-5 text-amber-100"
          >
            <HiExclamationTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}

        {success ? (
          <div
            role="status"
            className="flex gap-3 rounded-xl border border-accent/25 bg-accent/10 p-4 text-xs leading-5 text-accent"
          >
            <HiCheckCircle className="mt-0.5 size-4 shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        <Card className="p-5">
          <p className="text-sm font-semibold">
            {profile.profile_complete ? "You’re ready to continue" : "Setup still required"}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {!profile.profile_complete
              ? owner
                ? providers.phone
                  ? "Save your details and verify both contacts to enter the owner workspace."
                  : "Save your details, then configure Twilio Verify and verify your mobile number to enter the owner workspace."
                : "Save your details and verify at least one contact to browse venues."
              : !profile.can_book && !owner
                ? "Browsing is ready. Verify your mobile number before your first booking."
                : "Your account meets the current access requirements."}
          </p>
          {profile.profile_complete ? (
            <a
              href={nextPath}
              className="focus-ring mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-[#e4ff68]"
            >
              Open {owner ? "owner workspace" : "player workspace"}
              <HiArrowRight className="size-4" />
            </a>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
