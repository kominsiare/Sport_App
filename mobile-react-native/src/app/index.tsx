import { Redirect } from "expo-router";

import { LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/context/auth-context";

export default function IndexScreen() {
  const { configured, loading, user, profile } = useAuth();

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }
  if (!configured) return <Redirect href="/login" />;
  if (!user) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/role" />;
  if (!profile.profile_complete) return <Redirect href="/onboarding" />;
  return (
    <Redirect
      href={profile.account_type === "owner" ? "/(owner)" : "/(player)"}
    />
  );
}
