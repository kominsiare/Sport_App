import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Booking, BookingHold, Payment } from "@/types/database";

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
}> {
  const supabase = await releaseExpiredHolds();
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
  };
}
