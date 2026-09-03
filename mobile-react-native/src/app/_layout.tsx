import "react-native-url-polyfill/auto";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/context/auth-context";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            animation: "fade_from_bottom",
            contentStyle: { backgroundColor: colors.canvas },
            headerShown: false,
          }}
        />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
