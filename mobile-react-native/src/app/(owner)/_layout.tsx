import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ColorValue } from "react-native";

import { LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { colors, tabBarStyle } from "@/lib/theme";

const icon = (name: React.ComponentProps<typeof MaterialCommunityIcons>["name"]) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <MaterialCommunityIcons color={color} name={name} size={size} />
  );

export default function OwnerLayout() {
  const { loading, profile, user } = useAuth();
  if (loading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (!user) return <Redirect href="/login" />;
  if (!profile?.profile_complete) return <Redirect href="/" />;
  if (profile.account_type !== "owner") return <Redirect href="/(player)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.greenDark,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: icon("view-dashboard-outline"), title: "Dashboard" }}
      />
      <Tabs.Screen
        name="venues"
        options={{ tabBarIcon: icon("stadium-outline"), title: "Venues" }}
      />
      <Tabs.Screen
        name="activity"
        options={{ tabBarIcon: icon("receipt-text-outline"), title: "Activity" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: icon("account-circle-outline"), title: "Profile" }}
      />
    </Tabs>
  );
}
