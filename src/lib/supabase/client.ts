"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnvironment } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;
let implicitBrowserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getBrowserSupabaseClient() {
  if (!browserClient) {
    const { url, publishableKey } = getSupabaseEnvironment();
    browserClient = createBrowserClient<Database>(url, publishableKey);
  }

  return browserClient;
}

export function getImplicitBrowserSupabaseClient() {
  if (!implicitBrowserClient) {
    const { url, publishableKey } = getSupabaseEnvironment();
    implicitBrowserClient = createClient<Database>(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "implicit",
        persistSession: false,
      },
    });
  }

  return implicitBrowserClient;
}
