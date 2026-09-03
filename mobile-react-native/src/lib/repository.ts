import * as Crypto from "expo-crypto";

import { supabase } from "./supabase";
import type {
  Booking,
  BookingBundle,
  BookingHold,
  CatalogBundle,
  Commission,
  Court,
  CourtSport,
  MatchmakingPost,
  OwnerBundle,
  OwnerLog,
  Payment,
  PaymentOrder,
  Profile,
  RazorpayReturn,
  Slot,
  Sport,
  Venue,
  VenueApproval,
  VenueImage,
  WeeklyRule,
} from "./types";

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

function unwrap<T>(result: QueryResult<T>, fallback?: T): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data == null) {
    if (fallback !== undefined) return fallback;
    throw new Error("The server returned no data.");
  }
  return result.data;
}

function one<T>(value: T | T[] | null): T {
  if (Array.isArray(value)) {
    if (!value[0]) throw new Error("The server returned no record.");
    return value[0];
  }
  if (!value) throw new Error("The server returned no record.");
  return value;
}

async function bestEffortRpc(name: string) {
  const { error } = await supabase.rpc(name);
  if (error && !error.message.toLowerCase().includes("could not find")) {
    throw new Error(error.message);
  }
}

function cleanOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (slug || "venue").slice(0, 70);
}

export type VenueDraft = {
  id?: string;
  name: string;
  city: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  amenities: string[];
  imageUrl: string;
};

export type CourtDraft = {
  id?: string;
  venueId: string;
  name: string;
  type: string;
  duration: number;
  price: number;
  sportIds: string[];
};

export type RuleDraft = {
  courtId: string;
  sportId: string;
  weekday: number;
  opens: string;
  closes: string;
  duration: number;
  price: number;
};

export const repository = {
  async profile(): Promise<Profile | null> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;
    const result = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return result.data as Profile | null;
  },

  async ensureProfile(accountType: "player" | "owner"): Promise<Profile> {
    const result = await supabase.rpc("ensure_my_profile", {
      p_account_type: accountType,
    });
    return one(unwrap(result as QueryResult<Profile | Profile[]>));
  },

  async updateProfile(input: {
    fullName: string;
    city: string;
    businessName?: string | null;
  }): Promise<Profile> {
    const result = await supabase.rpc("update_my_profile", {
      p_full_name: input.fullName.trim(),
      p_city: input.city,
      p_business_name: cleanOptional(input.businessName),
    });
    return one(unwrap(result as QueryResult<Profile | Profile[]>));
  },

  async catalog(): Promise<CatalogBundle> {
    await bestEffortRpc("refresh_demo_catalog_slots");
    const now = new Date().toISOString();
    const [venuesResult, courtsResult, sportsResult, courtSportsResult, slotsResult] =
      await Promise.all([
        supabase
          .from("venue_catalog")
          .select("*")
          .order("sort_priority")
          .order("name"),
        supabase.from("courts").select("*").eq("is_active", true).order("name"),
        supabase.from("sports").select("*").eq("is_active", true).order("name"),
        supabase.from("court_sports").select("*").eq("is_active", true),
        supabase
          .from("slots")
          .select("*")
          .eq("status", "available")
          .gt("start_time", now)
          .order("start_time")
          .limit(1000),
      ]);

    return {
      venues: unwrap(venuesResult as QueryResult<Venue[]>, []),
      courts: unwrap(courtsResult as QueryResult<Court[]>, []),
      sports: unwrap(sportsResult as QueryResult<Sport[]>, []),
      courtSports: unwrap(
        courtSportsResult as QueryResult<CourtSport[]>,
        [],
      ),
      slots: unwrap(slotsResult as QueryResult<Slot[]>, []),
    };
  },

  async bookingActivity(): Promise<BookingBundle> {
    await bestEffortRpc("expire_booking_holds");
    await bestEffortRpc("expire_matchmaking_posts");
    const [holdsResult, paymentsResult, bookingsResult, postsResult] =
      await Promise.all([
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
        supabase
          .from("matchmaking_posts")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    return {
      holds: unwrap(holdsResult as QueryResult<BookingHold[]>, []),
      payments: unwrap(paymentsResult as QueryResult<Payment[]>, []),
      bookings: unwrap(bookingsResult as QueryResult<Booking[]>, []),
      posts: unwrap(postsResult as QueryResult<MatchmakingPost[]>, []),
    };
  },

  async matchmakingFeed(): Promise<MatchmakingPost[]> {
    await bestEffortRpc("refresh_demo_catalog_slots");
    await bestEffortRpc("expire_matchmaking_posts");
    const result = await supabase
      .from("matchmaking_feed")
      .select("*")
      .order("snapshot_start_time");
    return unwrap(result as QueryResult<MatchmakingPost[]>, []);
  },

  async createHold(slotId: string): Promise<BookingHold> {
    const result = await supabase.rpc("create_booking_hold", {
      p_slot_id: slotId,
    });
    return one(unwrap(result as QueryResult<BookingHold | BookingHold[]>));
  },

  async cancelHold(holdId: string): Promise<BookingHold> {
    const result = await supabase.rpc("cancel_my_booking_hold", {
      p_hold_id: holdId,
    });
    return one(unwrap(result as QueryResult<BookingHold | BookingHold[]>));
  },

  async createMatchPost(input: {
    bookingId: string;
    teamName: string;
    skill?: string | null;
    note?: string | null;
  }): Promise<MatchmakingPost> {
    const result = await supabase.rpc("create_matchmaking_post", {
      p_booking_id: input.bookingId,
      p_team_name: input.teamName.trim(),
      p_skill_level: cleanOptional(input.skill),
      p_note: cleanOptional(input.note),
    });
    return one(
      unwrap(result as QueryResult<MatchmakingPost | MatchmakingPost[]>),
    );
  },

  async joinMatchPost(input: {
    postId: string;
    teamName: string;
    note?: string | null;
  }): Promise<MatchmakingPost> {
    const result = await supabase.rpc("join_matchmaking_post", {
      p_post_id: input.postId,
      p_team_name: input.teamName.trim(),
      p_note: cleanOptional(input.note),
    });
    return one(
      unwrap(result as QueryResult<MatchmakingPost | MatchmakingPost[]>),
    );
  },

  async cancelMatchPost(postId: string): Promise<MatchmakingPost> {
    const result = await supabase.rpc("cancel_my_matchmaking_post", {
      p_post_id: postId,
    });
    return one(
      unwrap(result as QueryResult<MatchmakingPost | MatchmakingPost[]>),
    );
  },

  async createPaymentOrder(holdId: string): Promise<PaymentOrder> {
    const { data, error } = await supabase.functions.invoke("razorpay-order", {
      body: { hold_id: holdId },
    });
    if (error) throw new Error(error.message);
    return one(data as PaymentOrder | PaymentOrder[]);
  },

  async verifyPaymentReturn(payload: RazorpayReturn) {
    const { data, error } = await supabase.functions.invoke(
      "razorpay-payment-return",
      { body: payload },
    );
    if (error) throw new Error(error.message);
    return data;
  },

  async ownerDashboard(): Promise<OwnerBundle> {
    await bestEffortRpc("expire_booking_holds");
    const now = new Date().toISOString();
    const results = await Promise.all([
      supabase
        .from("venues")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("venue_images").select("*").order("sort_order"),
      supabase.from("venue_approvals").select("*"),
      supabase.from("courts").select("*").order("created_at"),
      supabase.from("court_sports").select("*"),
      supabase.from("sports").select("*").eq("is_active", true).order("name"),
      supabase
        .from("weekly_availability_rules")
        .select("*")
        .order("weekday"),
      supabase
        .from("slots")
        .select("*")
        .gte("start_time", now)
        .order("start_time")
        .limit(1200),
      supabase
        .from("booking_holds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("commission_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("owner_operation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      venues: unwrap(results[0] as QueryResult<Venue[]>, []),
      images: unwrap(results[1] as QueryResult<VenueImage[]>, []),
      approvals: unwrap(results[2] as QueryResult<VenueApproval[]>, []),
      courts: unwrap(results[3] as QueryResult<Court[]>, []),
      courtSports: unwrap(results[4] as QueryResult<CourtSport[]>, []),
      sports: unwrap(results[5] as QueryResult<Sport[]>, []),
      rules: unwrap(results[6] as QueryResult<WeeklyRule[]>, []),
      slots: unwrap(results[7] as QueryResult<Slot[]>, []),
      holds: unwrap(results[8] as QueryResult<BookingHold[]>, []),
      payments: unwrap(results[9] as QueryResult<Payment[]>, []),
      bookings: unwrap(results[10] as QueryResult<Booking[]>, []),
      commissions: unwrap(results[11] as QueryResult<Commission[]>, []),
      logs: unwrap(results[12] as QueryResult<OwnerLog[]>, []),
    };
  },

  async saveVenue(input: VenueDraft): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Authentication required.");
    const venueId = input.id ?? Crypto.randomUUID();
    const payload = {
      name: input.name.trim(),
      city: input.city,
      area: input.area.trim(),
      address: input.address.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      description: input.description.trim(),
      amenities: input.amenities,
    };

    if (!input.id) {
      const venueResult = await supabase.from("venues").insert({
        id: venueId,
        owner_user_id: user.id,
        slug: `${slugify(input.name)}-${venueId.slice(0, 8)}`,
        ...payload,
      });
      if (venueResult.error) throw new Error(venueResult.error.message);
      const imageResult = await supabase.from("venue_images").insert({
        id: Crypto.randomUUID(),
        venue_id: venueId,
        public_url: input.imageUrl.trim(),
        alt_text: `${input.name.trim()} sports venue`,
        is_primary: true,
      });
      if (imageResult.error) throw new Error(imageResult.error.message);
      return venueId;
    }

    const venueResult = await supabase
      .from("venues")
      .update(payload)
      .eq("id", venueId);
    if (venueResult.error) throw new Error(venueResult.error.message);

    const existingImage = await supabase
      .from("venue_images")
      .select("id")
      .eq("venue_id", venueId)
      .eq("is_primary", true)
      .maybeSingle();
    if (existingImage.error) throw new Error(existingImage.error.message);

    const imagePayload = {
      public_url: input.imageUrl.trim(),
      alt_text: `${input.name.trim()} sports venue`,
    };
    if (existingImage.data) {
      const updateImage = await supabase
        .from("venue_images")
        .update(imagePayload)
        .eq("id", existingImage.data.id);
      if (updateImage.error) throw new Error(updateImage.error.message);
    } else {
      const insertImage = await supabase.from("venue_images").insert({
        id: Crypto.randomUUID(),
        venue_id: venueId,
        ...imagePayload,
        is_primary: true,
      });
      if (insertImage.error) throw new Error(insertImage.error.message);
    }
    return venueId;
  },

  async deleteVenue(id: string) {
    const result = await supabase.from("venues").delete().eq("id", id);
    if (result.error) throw new Error(result.error.message);
  },

  async saveCourt(input: CourtDraft): Promise<string> {
    const courtId = input.id ?? Crypto.randomUUID();
    const payload = {
      name: input.name.trim(),
      court_type: input.type.trim(),
      default_duration_minutes: input.duration,
      base_price: input.price,
      is_active: true,
    };

    const courtResult = input.id
      ? await supabase.from("courts").update(payload).eq("id", courtId)
      : await supabase.from("courts").insert({
          id: courtId,
          venue_id: input.venueId,
          ...payload,
        });
    if (courtResult.error) throw new Error(courtResult.error.message);

    const existingResult = await supabase
      .from("court_sports")
      .select("*")
      .eq("court_id", courtId);
    const existing = unwrap(
      existingResult as QueryResult<CourtSport[]>,
      [],
    );

    await Promise.all(
      existing.map(async (record) => {
        const result = await supabase
          .from("court_sports")
          .update({ is_active: input.sportIds.includes(record.sport_id) })
          .eq("court_id", courtId)
          .eq("sport_id", record.sport_id);
        if (result.error) throw new Error(result.error.message);
      }),
    );

    const existingIds = new Set(existing.map((record) => record.sport_id));
    const additions = input.sportIds
      .filter((sportId) => !existingIds.has(sportId))
      .map((sportId) => ({
        court_id: courtId,
        sport_id: sportId,
        duration_minutes: input.duration,
        is_active: true,
      }));
    if (additions.length) {
      const result = await supabase.from("court_sports").insert(additions);
      if (result.error) throw new Error(result.error.message);
    }
    return courtId;
  },

  async saveRule(input: RuleDraft) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Authentication required.");
    const result = await supabase.from("weekly_availability_rules").insert({
      court_id: input.courtId,
      sport_id: input.sportId,
      weekday: input.weekday,
      start_local: input.opens,
      end_local: input.closes,
      duration_minutes: input.duration,
      price_total: input.price,
      is_active: true,
      created_by: user.id,
    });
    if (result.error) throw new Error(result.error.message);
  },

  async toggleRule(id: string, active: boolean) {
    const result = await supabase
      .from("weekly_availability_rules")
      .update({ is_active: active })
      .eq("id", id);
    if (result.error) throw new Error(result.error.message);
  },

  async deleteRule(id: string) {
    const result = await supabase
      .from("weekly_availability_rules")
      .delete()
      .eq("id", id);
    if (result.error) throw new Error(result.error.message);
  },

  async refreshVenueSlots(venueId: string) {
    const result = await supabase.rpc("refresh_my_venue_slots", {
      p_venue_id: venueId,
    });
    if (result.error) throw new Error(result.error.message);
  },

  async submitVenue(venueId: string) {
    const result = await supabase.rpc("submit_my_venue_for_review", {
      p_venue_id: venueId,
    });
    if (result.error) throw new Error(result.error.message);
  },

  async blockSlot(slotId: string, blocked: boolean, reason?: string) {
    const result = await supabase.rpc("set_my_slot_block", {
      p_slot_id: slotId,
      p_blocked: blocked,
      p_reason: blocked ? cleanOptional(reason) || "Owner unavailable" : null,
    });
    if (result.error) throw new Error(result.error.message);
  },
};
