export type AccountType = "player" | "owner";
export type TricityCity = "Chandigarh" | "Mohali" | "Panchkula";
export type VenueStatus = "draft" | "pending_review" | "active" | "suspended";
export type VenueApprovalDecision = "pending" | "approved" | "rejected";
export type SlotStatus = "available" | "held" | "booked" | "blocked" | "cancelled";
export type BookingHoldStatus =
  | "payment_pending"
  | "cancelled"
  | "expired"
  | "converted";
export type PaymentStatus =
  | "order_creating"
  | "order_created"
  | "payment_processing"
  | "captured"
  | "captured_review"
  | "failed"
  | "expired"
  | "refunded";
export type BookingStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "disputed"
  | "refunded";
export type CommissionCollectionStatus =
  | "collected_from_advance"
  | "partially_collected_owner_due"
  | "settled"
  | "waived";
export type WebhookProcessingStatus =
  | "received"
  | "processed"
  | "ignored"
  | "requires_review"
  | "failed";

export type Profile = {
  id: string;
  account_type: AccountType;
  full_name: string | null;
  business_name: string | null;
  city: TricityCity | null;
  email: string | null;
  phone: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  profile_complete: boolean;
  can_book: boolean;
  created_at: string;
  updated_at: string;
};

export type Sport = {
  id: string;
  slug: string;
  name: string;
  default_duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
};

export type Venue = {
  id: string;
  owner_user_id: string | null;
  slug: string;
  name: string;
  city: TricityCity;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  status: VenueStatus;
  is_featured: boolean;
  sort_priority: number;
  amenities: string[];
  last_owner_edit_at: string | null;
  submitted_for_review_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VenueImage = {
  id: string;
  venue_id: string;
  public_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export type Court = {
  id: string;
  venue_id: string;
  name: string;
  court_type: string;
  default_duration_minutes: number | null;
  base_price: number;
  is_active: boolean;
  attributes_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CourtSport = {
  court_id: string;
  sport_id: string;
  duration_minutes: number | null;
  is_active: boolean;
  sport_specific_attributes_json: Record<string, unknown>;
  created_at: string;
};

export type VenueSlot = {
  id: string;
  court_id: string;
  sport_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_total: number;
  status: SlotStatus;
  owner_block_reason: string | null;
  blocked_by: string | null;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VenueApproval = {
  venue_id: string;
  decision: VenueApprovalDecision;
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WeeklyAvailabilityRule = {
  id: string;
  court_id: string;
  sport_id: string;
  weekday: number;
  start_local: string;
  end_local: string;
  duration_minutes: number;
  price_total: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type OwnerOperationLog = {
  id: number;
  owner_user_id: string;
  venue_id: string | null;
  court_id: string | null;
  slot_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type BookingHold = {
  id: string;
  player_user_id: string;
  owner_user_id: string | null;
  venue_id: string | null;
  court_id: string | null;
  sport_id: string | null;
  slot_id: string | null;
  status: BookingHoldStatus;
  hold_started_at: string;
  expires_at: string;
  cancelled_at: string | null;
  converted_at: string | null;
  payment_processing_at: string | null;
  snapshot_venue_name: string;
  snapshot_venue_city: TricityCity;
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
  updated_at: string;
};

export type BookingAuditLog = {
  id: number;
  booking_hold_id: string | null;
  payment_id: string | null;
  booking_id: string | null;
  player_user_id: string | null;
  owner_user_id: string | null;
  venue_id: string | null;
  actor_user_id: string | null;
  action: string;
  old_status: BookingHoldStatus | null;
  new_status: BookingHoldStatus | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type Payment = {
  id: string;
  booking_hold_id: string;
  player_user_id: string;
  owner_user_id: string;
  status: PaymentStatus;
  amount_subunits: number;
  currency: string;
  razorpay_order_receipt: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  gateway_order_status: string | null;
  gateway_payment_status: string | null;
  order_claim_token: string | null;
  order_claimed_at: string | null;
  order_created_at: string | null;
  checkout_return_verified_at: string | null;
  captured_at: string | null;
  failed_at: string | null;
  failure_code: string | null;
  failure_description: string | null;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  booking_hold_id: string;
  payment_id: string;
  player_user_id: string;
  owner_user_id: string;
  venue_id: string | null;
  court_id: string | null;
  sport_id: string | null;
  slot_id: string | null;
  status: BookingStatus;
  snapshot_venue_name: string;
  snapshot_venue_city: TricityCity;
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
  updated_at: string;
};

export type CommissionRecord = {
  id: string;
  booking_id: string;
  payment_id: string;
  owner_user_id: string;
  total_booking_amount: number;
  advance_amount: number;
  commission_rate: number;
  commission_amount: number;
  collected_from_advance: number;
  owner_advance_credit: number;
  owner_due_amount: number;
  collection_status: CommissionCollectionStatus;
  created_at: string;
  updated_at: string;
};

export type RazorpayWebhookEvent = {
  event_id: string;
  event_type: string;
  payload_sha256: string;
  payload: Record<string, unknown>;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  processing_status: WebhookProcessingStatus;
  result: Record<string, unknown>;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
};

export type VenueCatalogRow = {
  id: string;
  slug: string;
  name: string;
  city: TricityCity;
  area: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  is_featured: boolean;
  sort_priority: number;
  amenities: string[];
  from_price: number;
  image_url: string;
  image_alt: string;
  sports: string[];
  sport_slugs: string[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          account_type: AccountType;
          full_name?: string | null;
          business_name?: string | null;
          city?: TricityCity | null;
          email?: string | null;
          phone?: string | null;
          email_verified_at?: string | null;
          phone_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          business_name?: string | null;
          city?: TricityCity | null;
          email?: string | null;
          phone?: string | null;
          email_verified_at?: string | null;
          phone_verified_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          granted_by: string | null;
          reason: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      auth_audit_logs: {
        Row: {
          id: number;
          actor_user_id: string | null;
          action: string;
          target_user_id: string | null;
          old_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      sports: {
        Row: Sport;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      venues: {
        Row: Venue;
        Insert: {
          id: string;
          owner_user_id: string;
          slug: string;
          name: string;
          city: TricityCity;
          area: string;
          address: string;
          latitude: number;
          longitude: number;
          description: string;
          status?: VenueStatus;
          is_featured?: boolean;
          sort_priority?: number;
          amenities?: string[];
          last_owner_edit_at?: string | null;
          submitted_for_review_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            Venue,
            | "slug"
            | "name"
            | "city"
            | "area"
            | "address"
            | "latitude"
            | "longitude"
            | "description"
            | "amenities"
            | "updated_at"
          >
        >;
        Relationships: [];
      };
      venue_images: {
        Row: VenueImage;
        Insert: {
          id: string;
          venue_id: string;
          public_url: string;
          alt_text: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Pick<VenueImage, "public_url" | "alt_text" | "sort_order" | "is_primary">
        >;
        Relationships: [];
      };
      venue_approvals: {
        Row: VenueApproval;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      courts: {
        Row: Court;
        Insert: {
          id: string;
          venue_id: string;
          name: string;
          court_type: string;
          default_duration_minutes?: number | null;
          base_price: number;
          is_active?: boolean;
          attributes_json?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            Court,
            | "name"
            | "court_type"
            | "default_duration_minutes"
            | "base_price"
            | "is_active"
            | "attributes_json"
            | "updated_at"
          >
        >;
        Relationships: [];
      };
      court_sports: {
        Row: CourtSport;
        Insert: {
          court_id: string;
          sport_id: string;
          duration_minutes?: number | null;
          is_active?: boolean;
          sport_specific_attributes_json?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<
          Pick<
            CourtSport,
            "duration_minutes" | "is_active" | "sport_specific_attributes_json"
          >
        >;
        Relationships: [];
      };
      slots: {
        Row: VenueSlot;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      weekly_availability_rules: {
        Row: WeeklyAvailabilityRule;
        Insert: {
          id?: string;
          court_id: string;
          sport_id: string;
          weekday: number;
          start_local: string;
          end_local: string;
          duration_minutes: number;
          price_total: number;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Pick<
            WeeklyAvailabilityRule,
            | "sport_id"
            | "weekday"
            | "start_local"
            | "end_local"
            | "duration_minutes"
            | "price_total"
            | "is_active"
            | "updated_at"
          >
        >;
        Relationships: [];
      };
      owner_operation_logs: {
        Row: OwnerOperationLog;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      booking_holds: {
        Row: BookingHold;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      booking_audit_logs: {
        Row: BookingAuditLog;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      commission_records: {
        Row: CommissionRecord;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      razorpay_webhook_events: {
        Row: RazorpayWebhookEvent;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      venue_catalog: {
        Row: VenueCatalogRow;
        Relationships: [];
      };
    };
    Functions: {
      ensure_my_profile: {
        Args: { p_account_type: string };
        Returns: Profile;
      };
      update_my_profile: {
        Args: {
          p_full_name: string;
          p_city: string;
          p_business_name?: string | null;
        };
        Returns: Profile;
      };
      submit_my_venue_for_review: {
        Args: { p_venue_id: string };
        Returns: Venue;
      };
      refresh_my_venue_slots: {
        Args: { p_venue_id: string };
        Returns: number;
      };
      set_my_slot_block: {
        Args: {
          p_slot_id: string;
          p_blocked: boolean;
          p_reason?: string | null;
        };
        Returns: number;
      };
      create_booking_hold: {
        Args: { p_slot_id: string };
        Returns: BookingHold;
      };
      cancel_my_booking_hold: {
        Args: { p_hold_id: string };
        Returns: BookingHold;
      };
      expire_booking_holds: {
        Args: Record<string, never>;
        Returns: number;
      };
      claim_my_razorpay_order: {
        Args: { p_hold_id: string; p_claim_token: string };
        Returns: {
          amount_subunits: number;
          currency: string;
          expires_at: string;
          hold_id: string;
          payment_id: string;
          razorpay_order_id: string | null;
          receipt: string;
          should_create: boolean;
          sport_name: string;
          venue_name: string;
        };
      };
      register_razorpay_order: {
        Args: {
          p_payment_id: string;
          p_claim_token: string;
          p_order_id: string;
          p_amount_subunits: number;
          p_currency: string;
          p_gateway_order_status: string;
          p_gateway_created_at: string;
        };
        Returns: Payment;
      };
      release_razorpay_order_claim: {
        Args: {
          p_payment_id: string;
          p_claim_token: string;
          p_failure_code: string;
          p_failure_description: string;
        };
        Returns: undefined;
      };
      mark_razorpay_payment_processing: {
        Args: {
          p_order_id: string;
          p_payment_id: string;
          p_amount_subunits: number;
          p_currency: string;
          p_gateway_payment_status: string;
        };
        Returns: Payment;
      };
      process_razorpay_webhook: {
        Args: {
          p_event_id: string;
          p_event_type: string;
          p_payload_sha256: string;
          p_payload: Record<string, unknown>;
          p_order_id: string;
          p_payment_id: string;
          p_amount_subunits: number;
          p_currency: string;
          p_gateway_payment_status: string;
        };
        Returns: Record<string, unknown>;
      };
    };
    Enums: {
      account_type: AccountType;
      tricity_city: TricityCity;
      venue_status: VenueStatus;
      venue_approval_decision: VenueApprovalDecision;
      slot_status: SlotStatus;
      booking_hold_status: BookingHoldStatus;
      payment_status: PaymentStatus;
      booking_status: BookingStatus;
      commission_collection_status: CommissionCollectionStatus;
      webhook_processing_status: WebhookProcessingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
