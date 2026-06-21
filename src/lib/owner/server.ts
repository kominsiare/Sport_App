import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  BookingHold,
  Court,
  CourtSport,
  OwnerOperationLog,
  Sport,
  Venue,
  VenueApproval,
  VenueImage,
  VenueSlot,
  WeeklyAvailabilityRule,
} from "@/types/database";

export type OwnerVenueSummary = Venue & {
  approval: VenueApproval | null;
  primaryImage: VenueImage | null;
  courtCount: number;
  sportCount: number;
  availableSlotCount: number;
  blockedSlotCount: number;
};

export type OwnerCourtOperations = Court & {
  sports: Array<
    CourtSport & {
      sport: Sport;
    }
  >;
  rules: WeeklyAvailabilityRule[];
  slots: Array<
    VenueSlot & {
      sport: Sport | null;
    }
  >;
};

export type OwnerVenueOperations = {
  venue: Venue;
  approval: VenueApproval | null;
  images: VenueImage[];
  courts: OwnerCourtOperations[];
  sports: Sport[];
  logs: OwnerOperationLog[];
};

export async function getOwnerDashboardData() {
  const supabase = await createServerSupabaseClient();
  const { error: expiryError } = await supabase.rpc("expire_booking_holds", {});

  if (expiryError) {
    throw new Error(`Unable to refresh booking holds: ${expiryError.message}`);
  }

  const now = new Date().toISOString();
  const [
    { data: venues, error: venuesError },
    { data: approvals, error: approvalsError },
    { data: images, error: imagesError },
    { data: courts, error: courtsError },
    { data: courtSports, error: courtSportsError },
    { data: slots, error: slotsError },
    { data: logs, error: logsError },
    { data: bookingHolds, error: bookingHoldsError },
  ] = await Promise.all([
    supabase.from("venues").select("*").order("created_at", { ascending: false }),
    supabase.from("venue_approvals").select("*"),
    supabase
      .from("venue_images")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("sort_order"),
    supabase.from("courts").select("*"),
    supabase.from("court_sports").select("*").eq("is_active", true),
    supabase.from("slots").select("*").gte("start_time", now),
    supabase
      .from("owner_operation_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("booking_holds")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const errors = [
    venuesError,
    approvalsError,
    imagesError,
    courtsError,
    courtSportsError,
    slotsError,
    logsError,
    bookingHoldsError,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Unable to load owner dashboard: ${errors[0]?.message}`);
  }

  const venueRows = venues ?? [];
  const approvalByVenue = new Map(
    (approvals ?? []).map((approval) => [approval.venue_id, approval]),
  );
  const primaryImageByVenue = new Map<string, VenueImage>();
  for (const image of images ?? []) {
    if (!primaryImageByVenue.has(image.venue_id)) {
      primaryImageByVenue.set(image.venue_id, image);
    }
  }

  const courtsByVenue = new Map<string, Court[]>();
  for (const court of courts ?? []) {
    const rows = courtsByVenue.get(court.venue_id) ?? [];
    rows.push(court);
    courtsByVenue.set(court.venue_id, rows);
  }

  const sportsByCourt = new Map<string, CourtSport[]>();
  for (const courtSport of courtSports ?? []) {
    const rows = sportsByCourt.get(courtSport.court_id) ?? [];
    rows.push(courtSport);
    sportsByCourt.set(courtSport.court_id, rows);
  }

  const slotsByCourt = new Map<string, VenueSlot[]>();
  for (const slot of slots ?? []) {
    const rows = slotsByCourt.get(slot.court_id) ?? [];
    rows.push(slot);
    slotsByCourt.set(slot.court_id, rows);
  }

  const summaries: OwnerVenueSummary[] = venueRows.map((venue) => {
    const venueCourts = courtsByVenue.get(venue.id) ?? [];
    const venueSlots = venueCourts.flatMap(
      (court) => slotsByCourt.get(court.id) ?? [],
    );
    const sportIds = new Set(
      venueCourts.flatMap((court) =>
        (sportsByCourt.get(court.id) ?? []).map((row) => row.sport_id),
      ),
    );

    return {
      ...venue,
      approval: approvalByVenue.get(venue.id) ?? null,
      primaryImage: primaryImageByVenue.get(venue.id) ?? null,
      courtCount: venueCourts.length,
      sportCount: sportIds.size,
      availableSlotCount: venueSlots.filter((slot) => slot.status === "available")
        .length,
      blockedSlotCount: venueSlots.filter((slot) => slot.status === "blocked")
        .length,
    };
  });

  return {
    venues: summaries,
    logs: logs ?? [],
    bookingHolds: (bookingHolds ?? []) as BookingHold[],
    metrics: {
      totalVenues: summaries.length,
      pendingReview: summaries.filter(
        (venue) =>
          venue.status === "pending_review" ||
          venue.approval?.decision === "pending",
      ).length,
      availableSlots: summaries.reduce(
        (total, venue) => total + venue.availableSlotCount,
        0,
      ),
      blockedSlots: summaries.reduce(
        (total, venue) => total + venue.blockedSlotCount,
        0,
      ),
      activeBookingHolds: (bookingHolds ?? []).filter(
        (hold) => hold.status === "payment_pending",
      ).length,
    },
  };
}

export async function getOwnerVenueOperations(
  venueId: string,
): Promise<OwnerVenueOperations | null> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .maybeSingle();

  if (venueError) {
    throw new Error(`Unable to load owner venue: ${venueError.message}`);
  }

  if (!venue) return null;

  const [
    { data: approval, error: approvalError },
    { data: images, error: imagesError },
    { data: courts, error: courtsError },
    { data: sports, error: sportsError },
    { data: logs, error: logsError },
  ] = await Promise.all([
    supabase
      .from("venue_approvals")
      .select("*")
      .eq("venue_id", venue.id)
      .maybeSingle(),
    supabase
      .from("venue_images")
      .select("*")
      .eq("venue_id", venue.id)
      .order("is_primary", { ascending: false })
      .order("sort_order"),
    supabase
      .from("courts")
      .select("*")
      .eq("venue_id", venue.id)
      .order("created_at"),
    supabase.from("sports").select("*").eq("is_active", true).order("name"),
    supabase
      .from("owner_operation_logs")
      .select("*")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const errors = [
    approvalError,
    imagesError,
    courtsError,
    sportsError,
    logsError,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Unable to load venue operations: ${errors[0]?.message}`);
  }

  const courtRows = courts ?? [];
  const courtIds = courtRows.map((court) => court.id);
  const [
    { data: courtSports, error: courtSportsError },
    { data: rules, error: rulesError },
    { data: slots, error: slotsError },
  ] =
    courtIds.length > 0
      ? await Promise.all([
          supabase
            .from("court_sports")
            .select("*")
            .in("court_id", courtIds)
            .order("created_at"),
          supabase
            .from("weekly_availability_rules")
            .select("*")
            .in("court_id", courtIds)
            .order("weekday")
            .order("start_local"),
          supabase
            .from("slots")
            .select("*")
            .in("court_id", courtIds)
            .gte("start_time", now)
            .order("start_time"),
        ])
      : [
          { data: [] as CourtSport[], error: null },
          { data: [] as WeeklyAvailabilityRule[], error: null },
          { data: [] as VenueSlot[], error: null },
        ];

  if (courtSportsError || rulesError || slotsError) {
    throw new Error(
      `Unable to load venue scheduling: ${
        courtSportsError?.message ?? rulesError?.message ?? slotsError?.message
      }`,
    );
  }

  const sportById = new Map(
    (sports ?? []).map((sport) => [sport.id, sport] as const),
  );

  return {
    venue,
    approval,
    images: images ?? [],
    sports: sports ?? [],
    logs: logs ?? [],
    courts: courtRows.map((court) => ({
      ...court,
      sports: (courtSports ?? [])
        .filter((row) => row.court_id === court.id)
        .flatMap((row) => {
          const sport = sportById.get(row.sport_id);
          return sport ? [{ ...row, sport }] : [];
        }),
      rules: (rules ?? []).filter((rule) => rule.court_id === court.id),
      slots: (slots ?? [])
        .filter((slot) => slot.court_id === court.id)
        .map((slot) => ({
          ...slot,
          sport: sportById.get(slot.sport_id) ?? null,
        })),
    })),
  };
}
