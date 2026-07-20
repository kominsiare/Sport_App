"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiCalendarDays,
  HiClock,
  HiCurrencyRupee,
  HiLockClosed,
} from "react-icons/hi2";

import { SlotCell } from "@/components/marketplace/slot-cell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DialogDrawer } from "@/components/ui/dialog-drawer";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { VenueSlot } from "@/types/database";

type BookableSlot = VenueSlot & {
  sportName: string;
  sportSlug: string;
};

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

function slotState(status: VenueSlot["status"]) {
  if (status === "available") return "available" as const;
  if (status === "held" || status === "blocked") return "held" as const;
  return "booked" as const;
}

function holdErrorMessage(message: string) {
  if (message.includes("active_booking_hold_exists")) {
    return "You already have an active payment hold. Cancel it or let it expire before choosing another slot.";
  }
  if (
    message.includes("slot_no_longer_available") ||
    message.includes("bookable_slot_not_found")
  ) {
    return "That slot was just taken or changed. Refresh the page and choose another time.";
  }
  if (message.includes("booking_enabled_player_required")) {
    return "Complete Player verification before starting a booking hold.";
  }
  return message;
}

export function BookingSlotPicker({
  venueName,
  courtName,
  slots,
  hasActiveHold,
}: {
  venueName: string;
  courtName: string;
  slots: BookableSlot[];
  hasActiveHold: boolean;
}) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function createHold() {
    if (!selectedSlot) return;

    setBusy(true);
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("create_booking_hold", {
      p_slot_id: selectedSlot.id,
    });

    if (error) {
      setBusy(false);
      setMessage(holdErrorMessage(error.message));
      router.refresh();
      return;
    }

    router.push("/app/player/bookings");
  }

  if (hasActiveHold) {
    return (
      <div className="mt-4 rounded-3xl border border-amber-300 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <HiLockClosed className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              One payment hold is already active
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800/80">
              Complete, cancel, or let that hold expire before selecting another
              physical court window.
            </p>
            <Link
              href="/app/player/bookings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3",
              )}
            >
              View active hold
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {slots.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.slice(0, 12).map((slot) => (
            <SlotCell
              key={slot.id}
              time={`${slot.sportName} · ${dateTime.format(
                new Date(slot.start_time),
              )} · ${money.format(slot.price_total)}`}
              state={slotState(slot.status)}
              onClick={
                slot.status === "available"
                  ? () => {
                      setSelectedSlot(slot);
                      setMessage("");
                    }
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No upcoming slots are available for this court.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Selecting a slot does not confirm a booking. The final button creates one
        ten-minute payment hold and blocks overlapping sports on this physical court.
      </p>

      <DialogDrawer
        open={Boolean(selectedSlot)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setSelectedSlot(null);
            setMessage("");
          }
        }}
        title="Review payment hold"
        description="Snapshot these details and reserve the physical court for ten minutes."
      >
        {selectedSlot ? (
          <div className="grid gap-4">
            <div className="arena-field rounded-3xl border border-border bg-secondary/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{selectedSlot.sportName}</Badge>
                <Badge variant="neutral">{selectedSlot.duration_minutes} min</Badge>
              </div>
              <h3 className="mt-4 font-semibold">{venueName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{courtName}</p>
              <div className="mt-4 grid gap-3 text-sm">
                <p className="flex items-center gap-2">
                  <HiCalendarDays className="size-4 text-primary" />
                  {dateTime.format(new Date(selectedSlot.start_time))}
                </p>
                <p className="flex items-center gap-2">
                  <HiClock className="size-4 text-primary" />
                  {selectedSlot.duration_minutes} minutes
                </p>
                <p className="flex items-center gap-2 font-semibold">
                  <HiCurrencyRupee className="size-4 text-primary" />
                  {money.format(selectedSlot.price_total)} total
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-semibold">₹500 advance comes next</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                This creates the real ten-minute hold. The Bookings page opens
                Razorpay, and the slot confirms only after the secure webhook.
              </p>
            </div>

            {message ? (
              <p className="rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </p>
            ) : null}

            <Button onClick={createHold} disabled={busy}>
              <HiLockClosed className="size-4" />
              {busy ? "Securing court…" : "Hold for 10 minutes"}
            </Button>
          </div>
        ) : null}
      </DialogDrawer>
    </>
  );
}
