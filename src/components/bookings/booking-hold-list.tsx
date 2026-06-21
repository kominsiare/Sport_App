"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  HiArrowPath,
  HiCalendarDays,
  HiClock,
  HiCurrencyRupee,
  HiMapPin,
  HiXMark,
} from "react-icons/hi2";

import { BookingStatusBadge } from "@/components/marketplace/booking-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { BookingHold } from "@/types/database";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function remainingSeconds(expiresAt: string) {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

function ActiveHoldCard({ hold }: { hold: BookingHold }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const expiryStarted = useRef(false);

  useEffect(() => {
    const updateCountdown = () => {
      setSeconds(remainingSeconds(hold.expires_at));
    };
    const initialTimer = window.setTimeout(updateCountdown, 0);
    const timer = window.setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [hold.expires_at]);

  useEffect(() => {
    if (seconds === null || seconds > 0 || expiryStarted.current) return;

    expiryStarted.current = true;
    const supabase = getBrowserSupabaseClient();
    void supabase.rpc("expire_booking_holds", {}).then(({ error }) => {
      if (error) {
        expiryStarted.current = false;
        setMessage(error.message);
        return;
      }
      router.refresh();
    });
  }, [router, seconds]);

  async function cancelHold() {
    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("cancel_my_booking_hold", {
      p_hold_id: hold.id,
    });

    setBusy(false);
    if (error) {
      setMessage(
        error.message.includes("booking_hold_not_cancellable")
          ? "This hold has already expired or changed."
          : error.message,
      );
      router.refresh();
      return;
    }

    router.refresh();
  }

  return (
    <Card className="overflow-hidden border-amber-400/30">
      <div className="border-b border-amber-400/20 bg-amber-400/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <BookingStatusBadge status={hold.status} />
            <h2 className="mt-4 text-xl font-bold">{hold.snapshot_venue_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hold.snapshot_court_name} · {hold.snapshot_sport_name}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-3xl font-bold text-amber-300">
              {seconds === null ? "--:--" : formatCountdown(seconds)}
            </p>
            <p className="mt-1 text-xs text-amber-100/60">hold remaining</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-3 text-sm">
          <p className="flex items-center gap-2">
            <HiMapPin className="size-4 text-accent" />
            {hold.snapshot_venue_area}, {hold.snapshot_venue_city}
          </p>
          <p className="flex items-center gap-2">
            <HiCalendarDays className="size-4 text-accent" />
            {dateTime.format(new Date(hold.snapshot_start_time))}
          </p>
          <p className="flex items-center gap-2">
            <HiClock className="size-4 text-accent" />
            {hold.snapshot_duration_minutes} minutes
          </p>
          <p className="flex items-center gap-2 font-semibold">
            <HiCurrencyRupee className="size-4 text-accent" />
            {money.format(hold.snapshot_total_amount)} total ·{" "}
            {money.format(hold.snapshot_advance_amount)} future advance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled>
            Razorpay in Module 6
          </Button>
          <Button variant="destructive" onClick={cancelHold} disabled={busy}>
            <HiXMark className="size-4" />
            {busy ? "Cancelling…" : "Cancel hold"}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mx-5 mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {message}
        </p>
      ) : null}
    </Card>
  );
}

export function BookingHoldList({ holds }: { holds: BookingHold[] }) {
  const activeHold =
    holds.find((hold) => hold.status === "payment_pending") ?? null;
  const history = holds.filter((hold) => hold.status !== "payment_pending");

  return (
    <>
      {activeHold ? (
        <ActiveHoldCard hold={activeHold} />
      ) : (
        <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <HiClock className="size-9 text-accent" />
          <h2 className="mt-4 font-semibold">No active payment hold</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Choose an approved venue slot to reserve its physical court for ten
            minutes.
          </p>
          <Link
            href="/app/player/venues"
            className={cn(buttonVariants(), "mt-5")}
          >
            Browse venues
          </Link>
        </Card>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Hold history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Snapshot details stay unchanged when venue prices or schedules change.
          </p>
        </div>
        <Badge variant="neutral">
          <HiArrowPath className="size-4" />
          Append-only activity
        </Badge>
      </div>

      {history.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {history.map((hold) => (
            <Card key={hold.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BookingStatusBadge status={hold.status} />
                    <Badge variant="neutral">{hold.snapshot_sport_name}</Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">
                    {hold.snapshot_venue_name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hold.snapshot_court_name} ·{" "}
                    {dateTime.format(new Date(hold.snapshot_start_time))}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="font-semibold text-accent">
                    {money.format(hold.snapshot_total_amount)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {dateTime.format(new Date(hold.created_at))}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Expired and cancelled holds will appear here.
        </p>
      )}
    </>
  );
}
