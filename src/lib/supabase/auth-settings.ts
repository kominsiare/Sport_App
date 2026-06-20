import { getSupabaseEnvironment, isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthProviderAvailability = {
  email: boolean;
  phone: boolean;
  google: boolean;
};

const unavailableProviders: AuthProviderAvailability = {
  email: false,
  phone: false,
  google: false,
};

export async function getAuthProviderAvailability(): Promise<AuthProviderAvailability> {
  if (!isSupabaseConfigured()) return unavailableProviders;

  const { url, publishableKey } = getSupabaseEnvironment();

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      cache: "no-store",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
    });

    if (!response.ok) return unavailableProviders;

    const settings = (await response.json()) as {
      external?: Partial<Record<keyof AuthProviderAvailability, boolean>>;
    };

    return {
      email: settings.external?.email === true,
      phone: settings.external?.phone === true,
      google: settings.external?.google === true,
    };
  } catch {
    return unavailableProviders;
  }
}
