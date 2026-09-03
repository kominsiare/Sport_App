"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  HiArrowRight,
  HiCalendarDays,
  HiCheckBadge,
  HiClock,
  HiCurrencyRupee,
  HiMapPin,
  HiShare,
  HiSparkles,
  HiUserGroup,
  HiXMark,
} from "react-icons/hi2";

import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  Booking,
  MatchmakingFeedRow,
  MatchmakingPost,
  MatchmakingStatus,
} from "@/types/database";

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

const statusCopy: Record<
  MatchmakingStatus,
  {
    label: string;
    variant: "accent" | "danger" | "neutral" | "success" | "warning";
  }
> = {
  open: { label: "Open", variant: "accent" },
  matched: { label: "Matched", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  expired: { label: "Expired", variant: "warning" },
};

const skillOptions = [
  { value: "open", label: "Open to all" },
  { value: "friendly", label: "Friendly game" },
  { value: "balanced", label: "Balanced level" },
  { value: "competitive", label: "Competitive" },
];

const skillLabels = Object.fromEntries(
  skillOptions.map((option) => [option.value, option.label]),
);

function errorMessage(message: string) {
  if (message.includes("team_name_required")) {
    return "Add a team name between 2 and 80 characters.";
  }
  if (message.includes("cannot_join_own_match")) {
    return "You cannot join your own opponent listing.";
  }
  if (message.includes("matchmaking_post_not_open")) {
    return "This listing is no longer open. Refresh and choose another match.";
  }
  if (message.includes("matchmaking_post_exists")) {
    return "This booking already has an active opponent search.";
  }
  if (message.includes("matchmaking_booking_must_be_future")) {
    return "Opponent search is only available before the slot starts.";
  }
  if (message.includes("booking_enabled_player_required")) {
    return "Verify your email or phone before using opponent finder.";
  }
  if (message.includes("matchmaking_note_too_long")) {
    return "Keep the note under 240 characters.";
  }
  if (
    message.includes("create_matchmaking_post") ||
    message.includes("join_matchmaking_post") ||
    message.includes("cancel_my_matchmaking_post") ||
    message.includes("matchmaking_posts") ||
    message.toLowerCase().includes("could not find the function")
  ) {
    return "Opponent finder is being updated. Refresh in a moment and try again.";
  }
  return message;
}

function StatusBadge({ status }: { status: MatchmakingStatus }) {
  const copy = statusCopy[status];
  return (
    <Badge variant={copy.variant}>
      {status === "matched" ? (
        <HiCheckBadge className="size-4" />
      ) : (
        <HiUserGroup className="size-4" />
      )}
      {copy.label}
    </Badge>
  );
}

function MatchCard({
  post,
  currentUserId,
  mode,
}: {
  post: MatchmakingFeedRow;
  currentUserId: string;
  mode: "join" | "mine";
}) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"join" | "cancel" | "share" | null>(null);
  const [message, setMessage] = useState("");
  const isHost = post.host_user_id === currentUserId;
  const isOpponent = post.opponent_user_id === currentUserId;
  const canJoin = mode === "join" && post.status === "open" && !isHost;
  const canCancel =
    mode === "mine" &&
    ((isHost && (post.status === "open" || post.status === "matched")) ||
      (isOpponent && post.status === "matched"));
  const canShare = mode === "mine" && isHost && post.status === "open";

  async function joinMatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("join");
    setMessage("");

    const { getBrowserSupabaseClient } = await import("@/lib/supabase/client");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("join_matchmaking_post", {
      p_post_id: post.id,
      p_team_name: teamName,
      p_note: note || null,
    });

    setBusy(null);
    if (error) {
      setMessage(errorMessage(error.message));
      return;
    }

    setTeamName("");
    setNote("");
    router.refresh();
  }

  async function cancelOrLeaveMatch() {
    setBusy("cancel");
    setMessage("");

    const { getBrowserSupabaseClient } = await import("@/lib/supabase/client");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("cancel_my_matchmaking_post", {
      p_post_id: post.id,
    });

    setBusy(null);
    if (error) {
      setMessage(errorMessage(error.message));
      return;
    }

    router.refresh();
  }

  async function shareMatch() {
    setBusy("share");
    setMessage("");
    const shareUrl = `${window.location.origin}/app/player/opponents#match-${post.id}`;
    const shareData = {
      title: `${post.host_team_name} needs an opponent`,
      text: `${post.snapshot_sport_name} at ${post.snapshot_venue_name} on ${dateTime.format(
        new Date(post.snapshot_start_time),
      )}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setMessage("Match invitation shared.");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setMessage("Match link copied.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setBusy(null);
        return;
      }
      setMessage("Could not share automatically. Copy the page URL instead.");
    }
    setBusy(null);
  }

  return (
    <Card id={`match-${post.id}`} className="scroll-mt-24 overflow-hidden">
      <div className="relative border-b border-border/70 bg-secondary/30 p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={post.status} />
              <Badge variant="neutral">{post.snapshot_sport_name}</Badge>
              <Badge variant="neutral">
                {skillLabels[post.skill_level ?? "open"] ?? "Open to all"}
              </Badge>
            </div>
            <h2 className="mt-4 text-lg font-semibold">{post.host_team_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {post.snapshot_venue_name} · {post.snapshot_court_name}
            </p>
          </div>
          {canShare || canCancel ? (
            <div className="flex flex-wrap gap-2">
              {canShare ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareMatch}
                  disabled={busy !== null}
                >
                  <HiShare className="size-4" />
                  {busy === "share" ? "Sharing…" : "Share match"}
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelOrLeaveMatch}
                  disabled={busy !== null}
                >
                  <HiXMark className="size-4" />
                  {busy === "cancel"
                    ? "Updating…"
                    : isOpponent
                      ? "Leave match"
                      : "Cancel listing"}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-3 text-sm">
          <p className="flex items-center gap-2">
            <HiMapPin className="size-4 text-primary" />
            {post.snapshot_venue_area}, {post.snapshot_venue_city}
          </p>
          <p className="flex items-center gap-2">
            <HiCalendarDays className="size-4 text-primary" />
            {dateTime.format(new Date(post.snapshot_start_time))}
          </p>
          <p className="flex items-center gap-2">
            <HiClock className="size-4 text-primary" />
            {post.snapshot_duration_minutes} minutes
          </p>
          <p className="flex items-center gap-2 font-semibold">
            <HiCurrencyRupee className="size-4 text-primary" />
            {money.format(post.snapshot_total_amount)} slot already booked
          </p>
          {post.host_note ? (
            <p className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
              “{post.host_note}”
            </p>
          ) : null}
          {post.opponent_team_name ? (
            <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
              Matched with <strong>{post.opponent_team_name}</strong>
              {post.opponent_note ? ` · “${post.opponent_note}”` : ""}
            </p>
          ) : null}
        </div>

        {canJoin ? (
          <form className="grid gap-3" onSubmit={joinMatch}>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Your team
              <Input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                minLength={2}
                maxLength={80}
                placeholder="e.g. Mohali Mavericks"
                disabled={busy !== null}
                required
              />
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Message
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={240}
                placeholder="Optional: share team strength, kit color, format…"
                disabled={busy !== null}
                rows={3}
                className="focus-ring w-full rounded-xl border border-input bg-card px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <Button type="submit" variant="accent" disabled={busy !== null}>
              <HiUserGroup className="size-4" />
              {busy === "join" ? "Joining…" : "Join this match"}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              Joining confirms your team for the match. It does not open a
              second Razorpay checkout.
            </p>
          </form>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-background/35 p-4">
            <p className="text-sm font-semibold">
              {isHost
                ? "You are hosting this match."
                : isOpponent
                  ? "Your team is in this match."
                  : "This listing is no longer joinable."}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Open listings can be joined by one opponent team. Matched listings
              stay visible in your queue.
            </p>
          </div>
        )}
      </div>

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="mx-5 mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {message}
        </p>
      ) : null}
    </Card>
  );
}

function HostBookingCard({
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const activePost =
    post?.status === "open" || post?.status === "matched" ? post : null;

  async function publishMatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { getBrowserSupabaseClient } = await import("@/lib/supabase/client");
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.rpc("create_matchmaking_post", {
      p_booking_id: booking.id,
      p_team_name: teamName,
      p_skill_level: skillLevel,
      p_note: note || null,
    });

    setBusy(false);
    if (error) {
      setMessage(errorMessage(error.message));
      return;
    }

    setTeamName("");
    setSkillLevel("open");
    setNote("");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="border-b border-border/70 bg-primary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                <HiCheckBadge className="size-4" />
                Slot booked
              </Badge>
              <Badge variant="neutral">{booking.snapshot_sport_name}</Badge>
              {activePost ? <StatusBadge status={activePost.status} /> : null}
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {booking.snapshot_venue_name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.snapshot_court_name} ·{" "}
              {dateTime.format(new Date(booking.snapshot_start_time))}
            </p>
          </div>
          <p className="font-mono text-xs font-semibold text-primary">
            {booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {activePost ? (
        <div className="p-5">
          <p className="text-sm font-semibold">
            {activePost.status === "matched"
              ? `${activePost.opponent_team_name} joined your match`
              : `${activePost.host_team_name} is visible to opponent teams`}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Manage, share, or cancel it from your match queue below.
          </p>
          <a
            href={`#match-${activePost.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-4",
            )}
          >
            Open listing
            <HiArrowRight className="size-4" />
          </a>
        </div>
      ) : (
        <form className="grid gap-4 p-5" onSubmit={publishMatch}>
          <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Team name
              <Input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                minLength={2}
                maxLength={80}
                placeholder="e.g. Sector 21 Strikers"
                disabled={busy}
                required
              />
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Match vibe
              <select
                value={skillLevel}
                onChange={(event) => setSkillLevel(event.target.value)}
                disabled={busy}
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
              rows={3}
              placeholder="Optional: team strength, format, kit colour…"
              disabled={busy}
              className="focus-ring w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-normal leading-6 normal-case tracking-normal text-foreground placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              Publishing shares this confirmed slot. It creates no new payment.
            </p>
            <Button type="submit" variant="accent" disabled={busy}>
              <HiSparkles className="size-4" />
              {busy ? "Publishing…" : "Publish opponent search"}
            </Button>
          </div>
        </form>
      )}

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="mx-5 mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {message}
        </p>
      ) : null}
    </Card>
  );
}

export function OpponentFinder({
  posts,
  currentUserId,
  bookings,
  bookingPosts,
  canBook,
  availableSlotCount,
  currentTime,
}: {
  posts: MatchmakingFeedRow[];
  currentUserId: string;
  bookings: Booking[];
  bookingPosts: MatchmakingPost[];
  canBook: boolean;
  availableSlotCount: number;
  currentTime: string;
}) {
  const { openPosts, myPosts, hostableBookings, activePostByBooking } =
    useMemo(() => {
      const currentTimeMs = new Date(currentTime).getTime();
      const open = posts.filter(
        (post) =>
          post.status === "open" && post.host_user_id !== currentUserId,
      );
      const mine = posts.filter(
        (post) =>
          post.host_user_id === currentUserId ||
          post.opponent_user_id === currentUserId,
      );
      const hostable = bookings
        .filter(
          (booking) =>
            booking.status === "confirmed" &&
            new Date(booking.snapshot_start_time).getTime() >
              currentTimeMs,
        )
        .sort(
          (left, right) =>
            new Date(left.snapshot_start_time).getTime() -
            new Date(right.snapshot_start_time).getTime(),
        );
      const postMap = new Map<string, MatchmakingPost>();
      for (const post of bookingPosts) {
        if (post.status !== "open" && post.status !== "matched") continue;
        const existing = postMap.get(post.booking_id);
        if (
          !existing ||
          new Date(post.created_at).getTime() >
            new Date(existing.created_at).getTime()
        ) {
          postMap.set(post.booking_id, post);
        }
      }

      return {
        openPosts: open,
        myPosts: mine,
        hostableBookings: hostable,
        activePostByBooking: postMap,
      };
    }, [bookingPosts, bookings, currentTime, currentUserId, posts]);

  const setupHref = canBook
    ? "/app/player/venues"
    : "/onboarding?next=/app/player/opponents";

  return (
    <div className="grid gap-8">
      <Card className="overflow-hidden p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="motion-pop grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <HiSparkles className="size-6" />
            </span>
            <div>
              <Badge variant="accent">Team matchmaking</Badge>
              <h2 className="mt-3 text-xl font-semibold">
                One booked slot. Two teams. One match.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Book for your team, publish the confirmed slot, and let another
                team join it. The opponent does not create a duplicate court
                booking or payment.
              </p>
            </div>
          </div>
          <Link
            href={setupHref}
            className={cn(buttonVariants({ variant: "default" }), "shrink-0")}
          >
            {canBook ? "Book a team slot" : "Finish verification"}
            <HiArrowRight className="size-4" />
          </Link>
        </div>

        <div className="motion-stagger mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Book", "Reserve a full slot for your team."],
            ["2", "Publish", "Open that confirmed slot to opponents."],
            ["3", "Match", "Another verified team joins the same game."],
          ].map(([number, title, description]) => (
            <div
              key={number}
              className="rounded-2xl border border-border bg-secondary/45 p-4"
            >
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {number}
              </span>
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <section id="host-match" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Host
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Publish one of your booked slots
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This is where your team starts an opponent search.
            </p>
          </div>
          <Badge variant={hostableBookings.length > 0 ? "accent" : "neutral"}>
            {hostableBookings.length} eligible
          </Badge>
        </div>

        {hostableBookings.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {hostableBookings.map((booking) => (
              <HostBookingCard
                key={booking.id}
                booking={booking}
                post={activePostByBooking.get(booking.id) ?? null}
              />
            ))}
          </div>
        ) : (
          <Card className="mt-4 p-5 md:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <HiCalendarDays className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">
                    {canBook
                      ? "Book a future slot to host the first match"
                      : "Verify your email or phone to host a match"}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {canBook
                      ? availableSlotCount > 0
                        ? `${availableSlotCount} future slots are available now. After the payment is verified, this page will show the booking here with a Publish opponent search button.`
                        : "No future venue slots are currently published. Browse venues again shortly or ask a venue owner to add weekly availability."
                      : "Verified email-link accounts and verified phone accounts can both book, publish, and join opponent matches."}
                  </p>
                </div>
              </div>
              <Link
                href={setupHref}
                className={cn(
                  buttonVariants({
                    variant: canBook ? "default" : "outline",
                  }),
                  "shrink-0",
                )}
              >
                {canBook ? "Choose a slot" : "Finish verification"}
                <HiArrowRight className="size-4" />
              </Link>
            </div>
          </Card>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Join
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Open opponent searches
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Join another team’s confirmed slot for a shared match.
            </p>
          </div>
          <Badge variant="accent">{openPosts.length} open</Badge>
        </div>

        {openPosts.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {openPosts.map((post) => (
              <MatchCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                mode="join"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="No team has published a match yet"
              description="Be the first: book a slot above, publish it here, then share the match link with another team."
              action={
                <a
                  href="#host-match"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Host the first match
                </a>
              }
            />
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">My match queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Listings you created or joined.
            </p>
          </div>
          <Badge variant="neutral">{myPosts.length} total</Badge>
        </div>

        {myPosts.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {myPosts.map((post) => (
              <MatchCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                mode="mine"
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Your hosted and joined opponent matches will appear here.
          </p>
        )}
      </section>
    </div>
  );
}
