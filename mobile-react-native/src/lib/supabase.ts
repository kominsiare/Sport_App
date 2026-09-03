import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { appConfig } from "./config";

const fallbackUrl = "https://placeholder.supabase.co";
const fallbackKey = "placeholder-publishable-key";

export const supabase = createClient(
  appConfig.supabaseUrl || fallbackUrl,
  appConfig.supabaseKey || fallbackKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  },
);
