import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Booking,
  BookingHold,
  MatchmakingPost,
  Payment,
} from "@/types/database";

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

async function releaseExpiredHolds() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("expire_booking_holds", {});

  if (error) {
    throw new Error(`Unable to release expired booking holds: ${error.message}`);
  }

  return supabase;
}

export async function getActivePlayerBookingHold(): Promise<BookingHold | null> {
  const supabase = await releaseExpiredHolds();
  const { data, error } = await supabase
    .from("booking_holds")
    .select("*")
    .eq("status", "payment_pending")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load the active booking hold: ${error.message}`);
  }

  return data;
}

export async function getPlayerBookingData(): Promise<{
  holds: BookingHold[];
  payments: Payment[];
  bookings: Booking[];
  matchmakingPosts: MatchmakingPost[];
}> {
  const supabase = await releaseExpiredHolds();
  const { error: matchmakingExpiryError } = await supabase.rpc(
    "expire_matchmaking_posts",
    {},
  );

  if (matchmakingExpiryError) {
    if (isMissingMatchmakingDatabase(matchmakingExpiryError.message)) {
      const [
        { data: holds, error: holdsError },
        { data: payments, error: paymentsError },
        { data: bookings, error: bookingsError },
      ] = await Promise.all([
        supabase
          .from("booking_holds")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      const firstError = holdsError ?? paymentsError ?? bookingsError;
      if (firstError) {
        throw new Error(`Unable to load booking activity: ${firstError.message}`);
      }

      return {
        holds: holds ?? [],
        payments: payments ?? [],
        bookings: bookings ?? [],
        matchmakingPosts: [],
      };
    }

    throw new Error(
      `Unable to refresh opponent finder listings: ${matchmakingExpiryError.message}`,
    );
  }

  const [
    { data: holds, error: holdsError },
    { data: payments, error: paymentsError },
    { data: bookings, error: bookingsError },
  ] = await Promise.all([
    supabase
      .from("booking_holds")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("*").order("created_at", { ascending: false }),
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
  ]);

  const firstError = holdsError ?? paymentsError ?? bookingsError;
  if (firstError) {
    throw new Error(`Unable to load booking activity: ${firstError.message}`);
  }

  return {
    holds: holds ?? [],
    payments: payments ?? [],
    bookings: bookings ?? [],
    matchmakingPosts:
      bookings && bookings.length > 0
        ? await getMatchmakingPostsForBookings(
            supabase,
            bookings.map((booking) => booking.id),
          )
        : [],
  };
}

async function getMatchmakingPostsForBookings(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  bookingIds: string[],
) {
  const { data, error } = await supabase
    .from("matchmaking_posts")
    .select("*")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load opponent finder posts: ${error.message}`);
  }

  return data ?? [];
}
