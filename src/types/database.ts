export type AccountType = "player" | "owner";
export type TricityCity = "Chandigarh" | "Mohali" | "Panchkula";

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
    };
    Views: Record<string, never>;
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
    };
    Enums: {
      account_type: AccountType;
      tricity_city: TricityCity;
    };
    CompositeTypes: Record<string, never>;
  };
};
