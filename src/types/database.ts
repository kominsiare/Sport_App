export type AccountType = "player" | "owner";
export type TricityCity = "Chandigarh" | "Mohali" | "Panchkula";
export type VenueStatus = "draft" | "pending_review" | "active" | "suspended";
export type VenueApprovalDecision = "pending" | "approved" | "rejected";
export type SlotStatus = "available" | "held" | "booked" | "blocked" | "cancelled";

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
  created_at: string;
  updated_at: string;
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
        Insert: never;
        Update: never;
        Relationships: [];
      };
      venue_images: {
        Row: VenueImage;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      venue_approvals: {
        Row: {
          venue_id: string;
          decision: VenueApprovalDecision;
          reviewed_by: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      courts: {
        Row: Court;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      court_sports: {
        Row: CourtSport;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      slots: {
        Row: VenueSlot;
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
      is_player_account: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_visible_venue: {
        Args: { p_venue_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      account_type: AccountType;
      tricity_city: TricityCity;
      venue_status: VenueStatus;
      venue_approval_decision: VenueApprovalDecision;
      slot_status: SlotStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
