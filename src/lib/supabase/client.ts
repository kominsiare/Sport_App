"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnvironment } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabaseClient() {
  if (!browserClient) {
    const { url, publishableKey } = getSupabaseEnvironment();
    browserClient = createBrowserClient<Database>(url, publishableKey);
  }

  return browserClient;
}
