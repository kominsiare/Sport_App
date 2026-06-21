import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BookingHold } from "@/types/database";

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
}> {
  const supabase = await releaseExpiredHolds();
  const { data: holds, error } = await supabase
    .from("booking_holds")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load booking activity: ${error.message}`);
  }

  return {
    holds: holds ?? [],
  };
}
