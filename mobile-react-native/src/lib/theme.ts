import { Platform } from "react-native";

export const colors = {
  ink: "#14211D",
  muted: "#66736E",
  subtle: "#8B9792",
  canvas: "#F5F7F6",
  surface: "#FFFFFF",
  surfaceSoft: "#EEF3F1",
  border: "#DFE7E3",
  green: "#00A86B",
  greenDark: "#007D50",
  mint: "#DDF6EA",
  lime: "#CFF36A",
  amber: "#F5A623",
  amberSoft: "#FFF3D9",
  red: "#D94343",
  redSoft: "#FDE8E8",
  blue: "#3A70E2",
  blueSoft: "#E8EEFC",
  black: "#07110D",
  white: "#FFFFFF",
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 42,
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: "#10261E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  android: { elevation: 3 },
  default: {
    boxShadow: "0 8px 28px rgba(16, 38, 30, 0.08)",
  },
});

export const tabBarStyle = {
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  height: Platform.OS === "ios" ? 86 : 70,
  paddingTop: 7,
  paddingBottom: Platform.OS === "ios" ? 24 : 9,
} as const;
