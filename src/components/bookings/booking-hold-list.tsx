"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiArrowPath,
  HiCalendarDays,
  HiCheckBadge,
  HiClock,
  HiCreditCard,
  HiCurrencyRupee,
  HiMapPin,
  HiReceiptPercent,
  HiShieldCheck,
  HiSparkles,
  HiUserGroup,
  HiXMark,
} from "react-icons/hi2";

import { BookingStatusBadge } from "@/components/marketplace/booking-status-badge";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type {
  Booking,
  BookingHold,
  MatchmakingPost,
  MatchmakingStatus,
  Payment,
} from "@/types/database";
import type {
  RazorpayCheckoutOptions,
  RazorpayCheckoutResponse,
} from "@/types/razorpay";

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

const matchmakingStatusCopy: Record<
  MatchmakingStatus,
  { label: string; variant: "accent" | "danger" | "neutral" | "success" | "warning" }
> = {
  open: { label: "Finding opponent", variant: "accent" },
  matched: { label: "Opponent matched", variant: "success" },
  cancelled: { label: "Search cancelled", variant: "neutral" },
  expired: { label: "Search expired", variant: "warning" },
};

const skillOptions = [
  { value: "open", label: "Open to all" },
  { value: "friendly", label: "Friendly game" },
  { value: "balanced", label: "Balanced level" },
  { value: "competitive", label: "Competitive" },
];

type OrderResponse = {
  key_id: string;
  payment_id: string;
  expires_at: string;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
};

let checkoutScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    const script = existing ?? document.createElement("script");

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        checkoutScriptPromise = null;
        reject(new Error("Razorpay Checkout could not be loaded."));
      },
      { once: true },
    );

    if (!existing) {
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return checkoutScriptPromise;
}

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

function isFutureBooking(booking: Booking) {
  return new Date(booking.snapshot_start_time).getTime() > Date.now();
}

function getMatchmakingErrorMessage(message: string) {
  if (message.includes("team_name_required")) {
    return "Add a team name between 2 and 80 characters.";
  }
  if (message.includes("matchmaking_post_exists")) {
    return "This booking already has an active opponent search.";
  }
  if (message.includes("matchmaking_booking_must_be_future")) {
    return "Opponent search is only available before the slot starts.";
  }
  if (message.includes("booking_enabled_player_required")) {
    return "Verify your player profile before using opponent finder.";
  }
  if (message.includes("matchmaking_note_too_long")) {
    return "Keep the note under 240 characters.";
  }
  if (
    message.includes("create_matchmaking_post") ||
    message.includes("matchmaking_posts") ||
    message.toLowerCase().includes("could not find the function")
  ) {
    return "Opponent finder is not live in Supabase yet. Apply the Module 7 migration, then try again.";
  }
  return message;
}

function MatchmakingStatusBadge({ status }: { status: MatchmakingStatus }) {
  const copy = matchmakingStatusCopy[status];
  return (
    <Badge variant={copy.variant}>
      <HiUserGroup className="size-4" />
      {copy.label}
    </Badge>
  );
}

function MatchmakingControls({
  booking,
  post,
}: {
  booking: Booking;
  post: MatchmakingPost | null;
}) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [skillLevel, setSkillLevel] = useState("open");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"create" | "cancel" | null>(null);
  const [message, setMessage] = useState("");
  const bookingIsFuture = isFutureBooking(booking);
  const activePost = post?.status === "open" || post?.status === "matched";
  const canCreate = booking.status === "confirmed" && bookingIsFuture && !activePost;

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    setMessage("");

    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("create_matchmaking_post", {
      p_booking_id: booking.id,
      p_team_name: teamName,
      p_skill_level: skillLevel,
      p_note: note || null,
    });

    setBusy(null);
    if (error) {
      setMessage(getMatchmakingErrorMessage(error.message));
      return;
    }

    setTeamName("");
    setSkillLevel("open");
    setNote("");
    router.refresh();
  }

  async function cancelPost() {
    if (!post) return;
    setBusy("cancel");
    setMessage("");

    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("cancel_my_matchmaking_post", {
      p_post_id: post.id,
    });

    setBusy(null);
    if (error) {
      setMessage(getMatchmakingErrorMessage(error.message));
      return;
    }

    router.refresh();
  }

  return (
    <div className="border-t border-border/70 bg-background/35 px-5 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">
              <HiSparkles className="size-4" />
              Opponent finder
            </Badge>
            {post ? <MatchmakingStatusBadge status={post.status} /> : null}
          </div>
          <h4 className="mt-3 text-sm font-semibold">
            {post?.status === "matched"
              ? `${post.opponent_team_name} joined this match`
              : activePost
                ? `${post?.host_team_name} is looking for a team`
                : "Need another team for this slot?"}
          </h4>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            Publish this confirmed booking when your team has the slot but still
            needs opponents. Another team can join the same match without
            creating a duplicate booking or payment.
          </p>
        </div>
        {activePost ? (
          <Button
            variant="outline"
            size="sm"
            onClick={cancelPost}
            disabled={busy !== null}
          >
            <HiXMark className="size-4" />
            {busy === "cancel" ? "Updating…" : "Cancel listing"}
          </Button>
        ) : null}
      </div>

      {post ? (
        <div className="mt-4 grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-4 text-xs text-muted-foreground sm:grid-cols-2">
          <div>
            <p className="font-semibold text-foreground">{post.host_team_name}</p>
            <p className="mt-1">
              {skillOptions.find((option) => option.value === post.skill_level)
                ?.label ?? "Open to all"}
            </p>
            {post.host_note ? (
              <p className="mt-2 leading-5 text-muted-foreground">
                “{post.host_note}”
              </p>
            ) : null}
          </div>
          <div className="sm:text-right">
            {post.opponent_team_name ? (
              <>
                <p className="font-semibold text-emerald-700">
                  {post.opponent_team_name}
                </p>
                {post.opponent_note ? (
                  <p className="mt-2 leading-5 text-muted-foreground">
                    “{post.opponent_note}”
                  </p>
                ) : null}
              </>
            ) : (
              <p>Visible in Opponents until {dateTime.format(new Date(post.expires_at))}.</p>
            )}
          </div>
        </div>
      ) : null}

      {canCreate ? (
        <form className="mt-4 grid gap-3" onSubmit={createPost}>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Your team
              <Input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                minLength={2}
                maxLength={80}
                placeholder="e.g. Sector 21 Strikers"
                disabled={busy !== null}
                required
              />
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Match vibe
              <select
                value={skillLevel}
                onChange={(event) => setSkillLevel(event.target.value)}
                disabled={busy !== null}
                className="focus-ring h-12 rounded-xl border border-input bg-card px-4 text-sm font-medium normal-case tracking-normal text-foreground"
              >
                {skillOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Note for opponents
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={240}
              placeholder="Optional: format, players needed, friendly/competitive context…"
              disabled={busy !== null}
              rows={3}
              className="focus-ring w-full rounded-xl border border-input bg-card px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="accent" disabled={busy !== null}>
              <HiUserGroup className="size-4" />
              {busy === "create" ? "Publishing…" : "Open opponent search"}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              No new payment is created; this shares the already confirmed slot.
            </p>
          </div>
        </form>
      ) : !bookingIsFuture ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Opponent finder is only available before the booked slot starts.
        </p>
      ) : null}

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function ActiveHoldCard({
  hold,
  payment,
}: {
  hold: BookingHold;
  payment: Payment | null;
}) {
  const router = useRouter();
  const [seconds, setSeconds] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<"pay" | "cancel" | null>(null);
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(
    payment?.status === "payment_processing",
  );
  const expiryStarted = useRef(false);
  const paymentLocked = Boolean(
    payment &&
      [
        "order_creating",
        "order_created",
        "payment_processing",
        "captured",
        "captured_review",
        "refunded",
      ].includes(payment.status),
  );

  useEffect(() => {
    const updateCountdown = () => {
      setSeconds(remainingSeconds(hold.expires_at));
    };
    const initialTimer = window.setTimeout(updateCountdown, 0);
    const timer = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [hold.expires_at]);

  useEffect(() => {
    if (
      paymentLocked ||
      seconds === null ||
      seconds > 0 ||
      expiryStarted.current
    ) {
      return;
    }

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
  }, [paymentLocked, router, seconds]);

  async function verifyCheckoutReturn(response: RazorpayCheckoutResponse) {
    setProcessing(true);
    setMessage("Payment received. Waiting for secure booking confirmation…");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.functions.invoke(
      "razorpay-payment-return",
      {
        body: response,
      },
    );

    if (error) {
      setMessage(
        "Razorpay accepted the checkout, but confirmation is still syncing. Do not pay again.",
      );
    } else {
      setMessage(
        "Payment verified. Your booking will confirm as soon as Razorpay’s secure webhook arrives.",
      );
    }

    setBusyAction(null);
    window.setTimeout(() => router.refresh(), 900);
  }

  async function startPayment() {
    setBusyAction("pay");
    setMessage("");

    try {
      await loadRazorpayCheckout();
      const supabase = getBrowserSupabaseClient();
      const { data, error } = await supabase.functions.invoke<OrderResponse>(
        "razorpay-order",
        {
          body: { hold_id: hold.id },
        },
      );

      if (error || !data) {
        throw new Error(
          "The payment order could not be prepared. Please try again.",
        );
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout is unavailable.");
      }

      const options: RazorpayCheckoutOptions = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Pllayz",
        description: `₹500 advance · ${hold.snapshot_venue_name}`,
        order_id: data.order.id,
        handler: verifyCheckoutReturn,
        modal: {
          ondismiss: () => {
            setBusyAction(null);
            setMessage(
              "Checkout closed. Your Razorpay order is saved, so you can continue without creating a duplicate.",
            );
            router.refresh();
          },
        },
        retry: { enabled: true },
        theme: {
          color: "#00a86b",
          backdrop_color: "#101814",
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (error) {
      setBusyAction(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to open Razorpay Checkout.",
      );
    }
  }

  async function cancelHold() {
    setBusyAction("cancel");
    setMessage("");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("cancel_my_booking_hold", {
      p_hold_id: hold.id,
    });

    setBusyAction(null);
    if (error) {
      setMessage(
        error.message.includes("payment_order_already_created")
          ? "This Razorpay order is already active and cannot be cancelled from the Player app."
          : error.message.includes("booking_hold_not_cancellable")
            ? "This hold has already expired or changed."
            : error.message,
      );
      router.refresh();
      return;
    }

    router.refresh();
  }

  const statusMessage =
    payment?.status === "captured_review"
      ? "Your payment was captured, but the court needs manual review. Do not pay again."
      : processing || payment?.status === "payment_processing"
        ? "Razorpay is confirming the captured payment. This page updates without another charge."
        : null;

  return (
    <Card className="overflow-hidden border-amber-300">
      <div className="border-b border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <BookingStatusBadge status={hold.status} />
              {payment ? <PaymentStatusBadge status={payment.status} /> : null}
            </div>
            <h2 className="mt-4 text-xl font-bold">{hold.snapshot_venue_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hold.snapshot_court_name} · {hold.snapshot_sport_name}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-3xl font-bold text-amber-700">
              {paymentLocked
                ? "LOCKED"
                : seconds === null
                  ? "--:--"
                  : formatCountdown(seconds)}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              {paymentLocked ? "payment in progress" : "hold remaining"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-3 text-sm">
          <p className="flex items-center gap-2">
            <HiMapPin className="size-4 text-primary" />
            {hold.snapshot_venue_area}, {hold.snapshot_venue_city}
          </p>
          <p className="flex items-center gap-2">
            <HiCalendarDays className="size-4 text-primary" />
            {dateTime.format(new Date(hold.snapshot_start_time))}
          </p>
          <p className="flex items-center gap-2">
            <HiClock className="size-4 text-primary" />
            {hold.snapshot_duration_minutes} minutes
          </p>
          <p className="flex items-center gap-2 font-semibold">
            <HiCurrencyRupee className="size-4 text-primary" />
            {money.format(hold.snapshot_total_amount)} total ·{" "}
            {money.format(hold.snapshot_advance_amount)} due now
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="accent"
            onClick={startPayment}
            disabled={
              busyAction !== null ||
              processing ||
              payment?.status === "captured_review"
            }
          >
            <HiCreditCard className="size-4" />
            {busyAction === "pay"
              ? "Preparing…"
              : payment?.razorpay_order_id
                ? "Continue ₹500 payment"
                : "Pay ₹500 securely"}
          </Button>
          <Button
            variant="destructive"
            onClick={cancelHold}
            disabled={busyAction !== null || paymentLocked}
          >
            <HiXMark className="size-4" />
            {busyAction === "cancel" ? "Cancelling…" : "Cancel hold"}
          </Button>
        </div>
      </div>

      {statusMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-5 mb-5 flex gap-3 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-primary"
        >
          <HiShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>{statusMessage}</p>
        </div>
      ) : null}

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="mx-5 mb-5 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground"
        >
          {message}
        </p>
      ) : null}
    </Card>
  );
}

function ConfirmedBookingCard({
  booking,
  payment,
  matchmakingPost,
}: {
  booking: Booking;
  payment: Payment | null;
  matchmakingPost: MatchmakingPost | null;
}) {
  return (
    <Card className="overflow-hidden border-emerald-400/25">
      <div className="border-b border-emerald-400/20 bg-emerald-400/8 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                <HiCheckBadge className="size-4" />
                Booking confirmed
              </Badge>
              {payment ? <PaymentStatusBadge status={payment.status} /> : null}
            </div>
            <h3 className="mt-4 text-lg font-bold">
              {booking.snapshot_venue_name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.snapshot_court_name} · {booking.snapshot_sport_name}
            </p>
          </div>
          <HiReceiptPercent className="size-8 text-primary" />
        </div>
      </div>
      <div className="grid gap-4 p-5 text-sm sm:grid-cols-2">
        <div className="grid gap-2">
          <p>{dateTime.format(new Date(booking.snapshot_start_time))}</p>
          <p className="text-muted-foreground">
            {booking.snapshot_duration_minutes} minutes ·{" "}
            {booking.snapshot_venue_area}, {booking.snapshot_venue_city}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="font-semibold text-primary">
            {money.format(booking.snapshot_advance_amount)} paid
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {money.format(
              booking.snapshot_total_amount - booking.snapshot_advance_amount,
            )}{" "}
            remaining at venue
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Booking {booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
      <MatchmakingControls booking={booking} post={matchmakingPost} />
    </Card>
  );
}

export function BookingHoldList({
  holds,
  payments,
  bookings,
  matchmakingPosts,
}: {
  holds: BookingHold[];
  payments: Payment[];
  bookings: Booking[];
  matchmakingPosts: MatchmakingPost[];
}) {
  const activeHold =
    holds.find((hold) => hold.status === "payment_pending") ?? null;
  const history = holds.filter((hold) => hold.status !== "payment_pending");
  const paymentByHold = useMemo(
    () => new Map(payments.map((payment) => [payment.booking_hold_id, payment])),
    [payments],
  );
  const paymentById = useMemo(
    () => new Map(payments.map((payment) => [payment.id, payment])),
    [payments],
  );
  const matchmakingPostByBooking = useMemo(() => {
    const activeStatuses = new Set<MatchmakingStatus>(["open", "matched"]);
    const result = new Map<string, MatchmakingPost>();

    for (const post of matchmakingPosts) {
      const existing = result.get(post.booking_id);
      if (!existing) {
        result.set(post.booking_id, post);
        continue;
      }

      const postIsActive = activeStatuses.has(post.status);
      const existingIsActive = activeStatuses.has(existing.status);
      const postCreatedAt = new Date(post.created_at).getTime();
      const existingCreatedAt = new Date(existing.created_at).getTime();

      if (
        (postIsActive && !existingIsActive) ||
        (postIsActive === existingIsActive && postCreatedAt > existingCreatedAt)
      ) {
        result.set(post.booking_id, post);
      }
    }

    return result;
  }, [matchmakingPosts]);
  const reviewPayments = payments.filter(
    (payment) => payment.status === "captured_review",
  );

  return (
    <>
      {activeHold ? (
        <ActiveHoldCard
          hold={activeHold}
          payment={paymentByHold.get(activeHold.id) ?? null}
        />
      ) : (
        <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <HiClock className="size-9 text-primary" />
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

      {reviewPayments.length > 0 ? (
        <Card className="mt-5 border-red-500/20 bg-red-50 p-5">
          <PaymentStatusBadge status="captured_review" />
          <h2 className="mt-4 font-semibold">Payment needs manual review</h2>
          <p className="mt-2 text-sm leading-6 text-red-700">
            Razorpay captured ₹500, but Pllayz did not create a potentially
            conflicting booking. Do not pay again; the payment ID is safely
            recorded for admin reconciliation.
          </p>
        </Card>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Confirmed bookings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only webhook-verified captured payments appear here.
          </p>
        </div>
        <Badge variant="success">
          <HiShieldCheck className="size-4" />
          Razorpay verified
        </Badge>
      </div>

      {bookings.length > 0 ? (
        <div className="mt-4 grid gap-4">
          {bookings.map((booking) => (
            <ConfirmedBookingCard
              key={booking.id}
              booking={booking}
              payment={paymentById.get(booking.payment_id) ?? null}
              matchmakingPost={matchmakingPostByBooking.get(booking.id) ?? null}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Your first paid booking receipt will appear here.
        </p>
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
          {history.map((hold) => {
            const payment = paymentByHold.get(hold.id) ?? null;
            return (
              <Card key={hold.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BookingStatusBadge status={hold.status} />
                      {payment ? (
                        <PaymentStatusBadge status={payment.status} />
                      ) : null}
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
                    <p className="font-semibold text-primary">
                      {money.format(hold.snapshot_total_amount)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {dateTime.format(new Date(hold.created_at))}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Expired and cancelled holds will appear here.
        </p>
      )}
    </>
  );
}
