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
import type { MatchmakingFeedRow, MatchmakingStatus } from "@/types/database";

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
  { label: string; variant: "accent" | "danger" | "neutral" | "success" | "warning" }
> = {
  open: { label: "Open", variant: "accent" },
  matched: { label: "Matched", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  expired: { label: "Expired", variant: "warning" },
};

const skillLabels: Record<string, string> = {
  open: "Open to all",
  friendly: "Friendly game",
  balanced: "Balanced level",
  competitive: "Competitive",
};

function errorMessage(message: string) {
  if (message.includes("team_name_required")) {
    return "Add your team name before joining.";
  }
  if (message.includes("cannot_join_own_match")) {
    return "You cannot join your own opponent listing.";
  }
  if (message.includes("matchmaking_post_not_open")) {
    return "This listing is no longer open. Refresh and choose another match.";
  }
  if (message.includes("booking_enabled_player_required")) {
    return "Verify your player profile before using opponent finder.";
  }
  if (message.includes("matchmaking_note_too_long")) {
    return "Keep the note under 240 characters.";
  }
  if (
    message.includes("join_matchmaking_post") ||
    message.includes("cancel_my_matchmaking_post") ||
    message.includes("matchmaking_posts") ||
    message.toLowerCase().includes("could not find the function")
  ) {
    return "Opponent finder is not live in Supabase yet. Apply the Module 7 migration, then try again.";
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
  const [busy, setBusy] = useState<"join" | "cancel" | null>(null);
  const [message, setMessage] = useState("");
  const isHost = post.host_user_id === currentUserId;
  const isOpponent = post.opponent_user_id === currentUserId;
  const canJoin = mode === "join" && post.status === "open" && !isHost;
  const canCancel =
    mode === "mine" &&
    ((isHost && (post.status === "open" || post.status === "matched")) ||
      (isOpponent && post.status === "matched"));

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

  return (
    <Card className="overflow-hidden">
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
            <h2 className="mt-4 text-lg font-semibold">
              {post.host_team_name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {post.snapshot_venue_name} · {post.snapshot_court_name}
            </p>
          </div>
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
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-3 text-sm">
          <p className="flex items-center gap-2">
            <HiMapPin className="size-4 text-accent" />
            {post.snapshot_venue_area}, {post.snapshot_venue_city}
          </p>
          <p className="flex items-center gap-2">
            <HiCalendarDays className="size-4 text-accent" />
            {dateTime.format(new Date(post.snapshot_start_time))}
          </p>
          <p className="flex items-center gap-2">
            <HiClock className="size-4 text-accent" />
            {post.snapshot_duration_minutes} minutes
          </p>
          <p className="flex items-center gap-2 font-semibold">
            <HiCurrencyRupee className="size-4 text-accent" />
            {money.format(post.snapshot_total_amount)} slot already booked
          </p>
          {post.host_note ? (
            <p className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
              “{post.host_note}”
            </p>
          ) : null}
          {post.opponent_team_name ? (
            <p className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs leading-5 text-emerald-100">
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
                className="focus-ring w-full rounded-xl border border-input bg-[#071020] px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <Button type="submit" variant="accent" disabled={busy !== null}>
              <HiUserGroup className="size-4" />
              {busy === "join" ? "Joining…" : "Join this match"}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              Joining confirms interest only. No extra Razorpay checkout is
              opened from this action.
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
          className="mx-5 mb-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
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
}: {
  posts: MatchmakingFeedRow[];
  currentUserId: string;
}) {
  const { openPosts, myPosts } = useMemo(() => {
    const open = posts.filter(
      (post) =>
        post.status === "open" &&
        post.host_user_id !== currentUserId,
    );
    const mine = posts.filter(
      (post) =>
        post.host_user_id === currentUserId ||
        post.opponent_user_id === currentUserId,
    );

    return { openPosts: open, myPosts: mine };
  }, [currentUserId, posts]);

  return (
    <div className="grid gap-7">
      <Card className="overflow-hidden p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
              <HiSparkles className="size-6" />
            </span>
            <div>
              <Badge variant="accent">Team matchmaking beta</Badge>
              <h2 className="mt-3 text-lg font-semibold">
                Book as a team. Find opponents when you need them.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                These are already-confirmed slots from teams who need an opponent.
                Joining a match does not create a duplicate court booking or open
                a payment checkout.
              </p>
            </div>
          </div>
          <Link
            href="/app/player/bookings"
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
          >
            Open my bookings
            <HiArrowRight className="size-4" />
          </Link>
        </div>
      </Card>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Open opponent searches</h2>
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
              title="No teams are looking right now"
              description="Publish one of your own confirmed bookings from the Bookings page, or check back when more teams open a match."
              action={
                <Link
                  href="/app/player/bookings"
                  className={buttonVariants({ variant: "outline" })}
                >
                  View my bookings
                </Link>
              }
            />
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">My match queue</h2>
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
