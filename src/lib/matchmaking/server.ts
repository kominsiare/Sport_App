import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MatchmakingFeedRow } from "@/types/database";

function isMissingMatchmakingDatabase(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("expire_matchmaking_posts") ||
    lower.includes("matchmaking_posts") ||
    lower.includes("matchmaking_feed") ||
    lower.includes("refresh_demo_catalog_slots") ||
    lower.includes("could not find the function") ||
    lower.includes("does not exist")
  );
}

export type PlayerMatchmakingPageData = {
  posts: MatchmakingFeedRow[];
  availableSlotCount: number;
  currentTime: string;
};

export async function getPlayerMatchmakingPageData(): Promise<PlayerMatchmakingPageData> {
  const supabase = await createServerSupabaseClient();
  const { error: refreshError } = await supabase.rpc(
    "refresh_demo_catalog_slots",
    {},
  );

  if (
    refreshError &&
    !isMissingMatchmakingDatabase(refreshError.message) &&
    !refreshError.message.includes("booking_enabled_player_required")
  ) {
    throw new Error(
      `Unable to refresh demo slot availability: ${refreshError.message}`,
    );
  }

  const { error: expiryError } = await supabase.rpc(
    "expire_matchmaking_posts",
    {},
  );

  if (expiryError && !isMissingMatchmakingDatabase(expiryError.message)) {
    throw new Error(
      `Unable to refresh opponent finder listings: ${expiryError.message}`,
    );
  }

  const currentTime = new Date().toISOString();
  const [
    { data: posts, error: postsError },
    { count: availableSlotCount, error: slotsError },
  ] = await Promise.all([
    supabase
      .from("matchmaking_feed")
      .select("*")
      .order("snapshot_start_time", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .eq("status", "available")
      .gt("start_time", currentTime),
  ]);

  if (postsError && !isMissingMatchmakingDatabase(postsError.message)) {
    throw new Error(
      `Unable to load opponent finder listings: ${postsError.message}`,
    );
  }

  if (slotsError) {
    throw new Error(
      `Unable to load bookable matchmaking slots: ${slotsError.message}`,
    );
  }

  return {
    posts: postsError ? [] : (posts ?? []),
    availableSlotCount: availableSlotCount ?? 0,
    currentTime,
  };
}
