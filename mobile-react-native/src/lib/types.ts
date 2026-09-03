export type Json = Record<string, unknown>;
export type AccountType = "player" | "owner";
export type City = "Chandigarh" | "Mohali" | "Panchkula";

export type Profile = {
  id: string;
  account_type: AccountType;
  full_name: string | null;
  business_name: string | null;
  city: City | null;
  email: string | null;
  phone: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  profile_complete: boolean;
  can_book: boolean;
};

export type Venue = {
  id: string;
  owner_user_id?: string | null;
  slug: string;
  name: string;
  city: City;
  area: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  status?: "draft" | "pending_review" | "active" | "suspended";
  is_featured?: boolean;
  sort_priority?: number;
  amenities: string[];
  from_price?: number;
  image_url?: string | null;
  image_alt?: string | null;
  sports?: string[];
  sport_slugs?: string[];
  submitted_for_review_at?: string | null;
  created_at?: string;
};

export type VenueImage = {
  id: string;
  venue_id: string;
  public_url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
};

export type VenueApproval = {
  venue_id: string;
  decision: "pending" | "approved" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
};

export type Sport = {
  id: string;
  slug: string;
  name: string;
  default_duration_minutes: number | null;
};

export type Court = {
  id: string;
  venue_id: string;
  name: string;
  court_type: string;
  default_duration_minutes: number | null;
  base_price: number;
  is_active: boolean;
  created_at?: string;
};

export type CourtSport = {
  court_id: string;
  sport_id: string;
  duration_minutes: number | null;
  is_active: boolean;
};

export type Slot = {
  id: string;
  court_id: string;
  sport_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_total: number;
  status: "available" | "held" | "booked" | "blocked" | "cancelled";
  owner_block_reason?: string | null;
};

export type BookingHold = {
  id: string;
  player_user_id: string;
  owner_user_id: string | null;
  venue_id: string | null;
  court_id: string | null;
  sport_id: string | null;
  slot_id: string | null;
  status: "payment_pending" | "payment_processing" | "converted" | "cancelled" | "expired";
  expires_at: string;
  snapshot_venue_name: string;
  snapshot_venue_city: City;
  snapshot_venue_area: string;
  snapshot_court_name: string;
  snapshot_court_type: string;
  snapshot_sport_name: string;
  snapshot_start_time: string;
  snapshot_end_time: string;
  snapshot_duration_minutes: number;
  snapshot_total_amount: number;
  snapshot_advance_amount: number;
  created_at: string;
};

export type Payment = {
  id: string;
  booking_hold_id: string;
  status:
    | "order_creating"
    | "order_created"
    | "payment_processing"
    | "captured"
    | "captured_review"
    | "failed"
    | "expired"
    | "refunded";
  amount_subunits: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  failure_description: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  booking_hold_id: string;
  payment_id: string;
  status: "confirmed" | "cancelled" | "completed" | "disputed" | "refunded";
  venue_id: string | null;
  court_id: string | null;
  sport_id: string | null;
  slot_id: string | null;
  snapshot_venue_name: string;
  snapshot_venue_city: City;
  snapshot_venue_area: string;
  snapshot_court_name: string;
  snapshot_court_type: string;
  snapshot_sport_name: string;
  snapshot_start_time: string;
  snapshot_end_time: string;
  snapshot_duration_minutes: number;
  snapshot_total_amount: number;
  snapshot_advance_amount: number;
  confirmed_at: string;
  created_at: string;
};

export type MatchmakingPost = {
  id: string;
  booking_id: string;
  host_user_id: string;
  opponent_user_id: string | null;
  status: "open" | "matched" | "cancelled" | "expired";
  host_team_name: string;
  opponent_team_name: string | null;
  skill_level: "open" | "friendly" | "balanced" | "competitive" | null;
  host_note: string | null;
  opponent_note: string | null;
  expires_at: string;
  matched_at: string | null;
  snapshot_venue_name: string;
  snapshot_venue_city: City;
  snapshot_venue_area: string;
  snapshot_court_name: string;
  snapshot_sport_name: string;
  snapshot_start_time: string;
  snapshot_end_time: string;
  snapshot_duration_minutes: number;
  snapshot_total_amount: number;
  created_at: string;
};

export type WeeklyRule = {
  id: string;
  court_id: string;
  sport_id: string;
  weekday: number;
  start_local: string;
  end_local: string;
  duration_minutes: number;
  price_total: number;
  is_active: boolean;
};

export type Commission = {
  id: string;
  booking_id: string;
  total_booking_amount: number;
  advance_amount: number;
  commission_rate: number;
  commission_amount: number;
  owner_advance_credit: number;
  owner_due_amount: number;
  collection_status: string;
  created_at: string;
};

export type OwnerLog = {
  id: number;
  venue_id: string | null;
  court_id: string | null;
  slot_id: string | null;
  action: string;
  details: Json;
  created_at: string;
};

export type CatalogBundle = {
  venues: Venue[];
  courts: Court[];
  sports: Sport[];
  courtSports: CourtSport[];
  slots: Slot[];
};

export type BookingBundle = {
  holds: BookingHold[];
  payments: Payment[];
  bookings: Booking[];
  posts: MatchmakingPost[];
};

export type OwnerBundle = CatalogBundle & {
  images: VenueImage[];
  approvals: VenueApproval[];
  rules: WeeklyRule[];
  holds: BookingHold[];
  payments: Payment[];
  bookings: Booking[];
  commissions: Commission[];
  logs: OwnerLog[];
};

export type PaymentOrder = {
  key_id: string;
  order: {
    id: string;
    amount: number;
    currency: string;
    status?: string;
  };
};

export type RazorpayReturn = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
