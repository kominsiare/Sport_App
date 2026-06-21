import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Court,
  CourtSport,
  Sport,
  VenueCatalogRow,
  VenueImage,
  VenueSlot,
} from "@/types/database";

export type VenueCourtDetail = Court & {
  sports: Array<{
    id: string;
    slug: string;
    name: string;
    durationMinutes: number;
  }>;
  slots: Array<
    VenueSlot & {
      sportName: string;
      sportSlug: string;
    }
  >;
};

export type VenueDetail = VenueCatalogRow & {
  images: VenueImage[];
  courts: VenueCourtDetail[];
};

export async function getVenueCatalog() {
  const supabase = await createServerSupabaseClient();

  const [{ data: venues, error: venuesError }, { data: sports, error: sportsError }] =
    await Promise.all([
      supabase
        .from("venue_catalog")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("sort_priority")
        .order("name"),
      supabase.from("sports").select("*").eq("is_active", true).order("name"),
    ]);

  if (venuesError) {
    throw new Error(`Unable to load venues: ${venuesError.message}`);
  }

  if (sportsError) {
    throw new Error(`Unable to load sports: ${sportsError.message}`);
  }

  return {
    venues: venues ?? [],
    sports: sports ?? [],
  };
}

export async function getVenueDetail(slug: string): Promise<VenueDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { error: expiryError } = await supabase.rpc("expire_booking_holds", {});

  if (expiryError) {
    throw new Error(`Unable to refresh slot availability: ${expiryError.message}`);
  }

  const { data: venue, error: venueError } = await supabase
    .from("venue_catalog")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (venueError) {
    throw new Error(`Unable to load venue: ${venueError.message}`);
  }

  if (!venue) return null;

  const [
    { data: images, error: imagesError },
    { data: courts, error: courtsError },
    { data: sports, error: sportsError },
  ] = await Promise.all([
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
      .eq("is_active", true)
      .order("base_price"),
    supabase.from("sports").select("*").eq("is_active", true),
  ]);

  if (imagesError) {
    throw new Error(`Unable to load venue images: ${imagesError.message}`);
  }

  if (courtsError) {
    throw new Error(`Unable to load courts: ${courtsError.message}`);
  }

  if (sportsError) {
    throw new Error(`Unable to load sports: ${sportsError.message}`);
  }

  const courtRows = courts ?? [];
  const courtIds = courtRows.map((court) => court.id);
  const now = new Date().toISOString();
  const [{ data: courtSports, error: courtSportsError }, { data: slots, error: slotsError }] =
    courtIds.length > 0
      ? await Promise.all([
          supabase
            .from("court_sports")
            .select("*")
            .in("court_id", courtIds)
            .eq("is_active", true),
          supabase
            .from("slots")
            .select("*")
            .in("court_id", courtIds)
            .gte("start_time", now)
            .order("start_time"),
        ])
      : [
          { data: [] as CourtSport[], error: null },
          { data: [] as VenueSlot[], error: null },
        ];

  if (courtSportsError) {
    throw new Error(`Unable to load supported sports: ${courtSportsError.message}`);
  }

  if (slotsError) {
    throw new Error(`Unable to load slots: ${slotsError.message}`);
  }

  const sportById = new Map(
    (sports ?? []).map((sport: Sport) => [sport.id, sport]),
  );
  const courtSportRows = courtSports ?? [];
  const slotRows = slots ?? [];

  return {
    ...venue,
    images: images ?? [],
    courts: courtRows.map((court) => {
      const supportedSports = courtSportRows
        .filter((courtSport) => courtSport.court_id === court.id)
        .flatMap((courtSport) => {
          const sport = sportById.get(courtSport.sport_id);
          if (!sport) return [];

          return [
            {
              id: sport.id,
              slug: sport.slug,
              name: sport.name,
              durationMinutes:
                courtSport.duration_minutes ??
                court.default_duration_minutes ??
                sport.default_duration_minutes ??
                60,
            },
          ];
        });

      return {
        ...court,
        sports: supportedSports,
        slots: slotRows
          .filter((slot) => slot.court_id === court.id)
          .flatMap((slot) => {
            const sport = sportById.get(slot.sport_id);
            if (!sport) return [];

            return [
              {
                ...slot,
                sportName: sport.name,
                sportSlug: sport.slug,
              },
            ];
          }),
      };
    }),
  };
}
