import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BookingAuditLog, BookingHold } from "@/types/database";

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
  auditLogs: BookingAuditLog[];
}> {
  const supabase = await releaseExpiredHolds();
  const [
    { data: holds, error: holdsError },
    { data: auditLogs, error: logsError },
  ] = await Promise.all([
    supabase
      .from("booking_holds")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("booking_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (holdsError || logsError) {
    throw new Error(
      `Unable to load booking activity: ${
        holdsError?.message ?? logsError?.message
      }`,
    );
  }

  return {
    holds: holds ?? [],
    auditLogs: auditLogs ?? [],
  };
}

export async function getOwnerBookingHolds(
  limit = 30,
): Promise<BookingHold[]> {
  const supabase = await releaseExpiredHolds();
  const { data, error } = await supabase
    .from("booking_holds")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to load owner booking holds: ${error.message}`);
  }

  return data ?? [];
}
