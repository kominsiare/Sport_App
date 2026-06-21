import { createClient } from "npm:@supabase/supabase-js@2.108.2";

import { requiredEnv } from "./http.ts";

export function createUserClient(authorization: string) {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    },
  );
}

export function createServiceClient() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export async function requireUser(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("authentication_required");
  }

  const client = createUserClient(authorization);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error("authentication_required");
  }

  return { client, user };
}
