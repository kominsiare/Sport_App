import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MatchmakingFeedRow } from "@/types/database";

function isMissingMatchmakingDatabase(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("expire_matchmaking_posts") ||
    lower.includes("matchmaking_posts") ||
    lower.includes("matchmaking_feed") ||
    lower.includes("could not find the function") ||
    lower.includes("does not exist")
  );
}

export async function getPlayerMatchmakingFeed(): Promise<MatchmakingFeedRow[]> {
  const supabase = await createServerSupabaseClient();
  const { error: expiryError } = await supabase.rpc(
    "expire_matchmaking_posts",
    {},
  );

  if (expiryError) {
    if (isMissingMatchmakingDatabase(expiryError.message)) {
      return [];
    }

    throw new Error(
      `Unable to refresh opponent finder listings: ${expiryError.message}`,
    );
  }

  const { data, error } = await supabase
    .from("matchmaking_feed")
    .select("*")
    .order("snapshot_start_time", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingMatchmakingDatabase(error.message)) {
      return [];
    }

    throw new Error(`Unable to load opponent finder listings: ${error.message}`);
  }

  return data ?? [];
}
