import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import {
  AppState,
  type AppStateStatus,
} from "react-native";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { appConfig } from "@/lib/config";
import { repository } from "@/lib/repository";
import { supabase } from "@/lib/supabase";
import type { AccountType, Profile } from "@/lib/types";

const PENDING_ROLE_KEY = "pllayz.pending-account-type";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  authError: string | null;
  sendMagicLink: (email: string, role: AccountType) => Promise<void>;
  chooseRole: (role: AccountType) => Promise<void>;
  saveProfile: (input: {
    fullName: string;
    city: string;
    businessName?: string | null;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function urlValue(url: string, key: string) {
  try {
    const parsed = new URL(url);
    const queryValue = parsed.searchParams.get(key);
    if (queryValue) return queryValue;
    const fragment = parsed.hash.startsWith("#")
      ? parsed.hash.slice(1)
      : parsed.hash;
    return new URLSearchParams(fragment).get(key);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const resolveProfile = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    let current = await repository.profile();
    if (!current) {
      const pendingRole = await AsyncStorage.getItem(PENDING_ROLE_KEY);
      if (pendingRole === "player" || pendingRole === "owner") {
        current = await repository.ensureProfile(pendingRole);
      }
    }
    setProfile(current);
  }, []);

  const handleDeepLink = useCallback(
    async (url: string | null) => {
      if (!url || !appConfig.isConfigured) return;
      const callbackError =
        urlValue(url, "error_description") || urlValue(url, "error");
      if (callbackError) {
        setAuthError(decodeURIComponent(callbackError.replaceAll("+", " ")));
        return;
      }

      try {
        const code = urlValue(url, "code");
        if (code) {
          const result = await supabase.auth.exchangeCodeForSession(code);
          if (result.error) throw result.error;
          await resolveProfile(result.data.session);
          return;
        }

        const accessToken = urlValue(url, "access_token");
        const refreshToken = urlValue(url, "refresh_token");
        if (accessToken && refreshToken) {
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (result.error) throw result.error;
          await resolveProfile(result.data.session);
        }
      } catch (error) {
        setAuthError(
          error instanceof Error
            ? error.message
            : "That sign-in link could not be completed.",
        );
      }
    },
    [resolveProfile],
  );

  useEffect(() => {
    if (!appConfig.isConfigured) {
      setLoading(false);
      return;
    }

    let alive = true;
    void (async () => {
      try {
        const result = await supabase.auth.getSession();
        if (result.error) throw result.error;
        if (alive) await resolveProfile(result.data.session);
        const initialUrl = await Linking.getInitialURL();
        if (alive && initialUrl) await handleDeepLink(initialUrl);
      } catch (error) {
        if (alive) {
          setAuthError(
            error instanceof Error ? error.message : "Unable to restore session.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const authSubscription = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!alive) return;
        void resolveProfile(nextSession).catch((error: unknown) => {
          setAuthError(
            error instanceof Error ? error.message : "Unable to load profile.",
          );
        });
      },
    );
    const linkSubscription = Linking.addEventListener("url", ({ url }) => {
      void handleDeepLink(url);
    });
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") supabase.auth.startAutoRefresh();
        else supabase.auth.stopAutoRefresh();
      },
    );

    return () => {
      alive = false;
      authSubscription.data.subscription.unsubscribe();
      linkSubscription.remove();
      appStateSubscription.remove();
    };
  }, [handleDeepLink, resolveProfile]);

  const sendMagicLink = useCallback(
    async (email: string, role: AccountType) => {
      await AsyncStorage.setItem(PENDING_ROLE_KEY, role);
      setAuthError(null);
      const result = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: appConfig.authRedirectUrl,
          data: { account_type: role },
          shouldCreateUser: true,
        },
      });
      if (result.error) throw result.error;
    },
    [],
  );

  const chooseRole = useCallback(async (role: AccountType) => {
    await AsyncStorage.setItem(PENDING_ROLE_KEY, role);
    const nextProfile = await repository.ensureProfile(role);
    setProfile(nextProfile);
  }, []);

  const saveProfile = useCallback(
    async (input: {
      fullName: string;
      city: string;
      businessName?: string | null;
    }) => {
      const nextProfile = await repository.updateProfile(input);
      setProfile(nextProfile);
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    const nextProfile = await repository.profile();
    setProfile(nextProfile);
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem(PENDING_ROLE_KEY);
      const result = await supabase.auth.signOut();
      if (result.error) throw result.error;
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: appConfig.isConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      authError,
      sendMagicLink,
      chooseRole,
      saveProfile,
      refreshProfile,
      signOut,
      clearAuthError: () => setAuthError(null),
    }),
    [
      authError,
      chooseRole,
      loading,
      profile,
      refreshProfile,
      saveProfile,
      sendMagicLink,
      session,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
