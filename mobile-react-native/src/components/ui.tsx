import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { errorMessage, titleCase } from "@/lib/format";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <Image
        contentFit="contain"
        source={require("../../assets/images/pllayz-mark.png")}
        style={{ height: compact ? 36 : 46, width: compact ? 36 : 46 }}
      />
      {!compact ? <Text style={styles.brandName}>Pllayz</Text> : null}
    </View>
  );
}

export function AnimatedEntry({
  children,
  delay = 0,
  style,
}: PropsWithChildren<{ delay?: number; style?: ViewStyle }>) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, opacity, translate]);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY: translate }] }]}
    >
      {children}
    </Animated.View>
  );
}

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}>;

export function Screen({
  children,
  title,
  subtitle,
  eyebrow,
  action,
  refreshing = false,
  onRefresh,
  scroll = true,
  contentStyle,
}: ScreenProps) {
  const { width } = useWindowDimensions();
  const horizontal = width >= 700 ? spacing.xl : spacing.md;
  const body = (
    <View
      style={[
        styles.screenContent,
        { paddingHorizontal: horizontal },
        contentStyle,
      ]}
    >
      {title ? (
        <AnimatedEntry>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.pageTitle}>{title}</Text>
              {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
            </View>
            {action}
          </View>
        </AnimatedEntry>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                colors={[colors.green]}
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={colors.green}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  tone = "default",
}: PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  tone?: "default" | "green" | "dark" | "soft" | "amber";
}>) {
  const toneStyle = {
    default: styles.card,
    green: styles.greenCard,
    dark: styles.darkCard,
    soft: styles.softCard,
    amber: styles.amberCard,
  }[tone];
  return <View style={[toneStyle, style]}>{children}</View>;
}

type ButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  compact = false,
  fullWidth = true,
}: ButtonProps) {
  const buttonStyle = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    ghost: styles.buttonGhost,
    danger: styles.buttonDanger,
    dark: styles.buttonDark,
  }[variant];
  const blocked = disabled || loading;
  const labelStyle = {
    primary: styles.buttonTextLight,
    secondary: styles.buttonTextGreen,
    ghost: styles.buttonTextInk,
    danger: styles.buttonTextDanger,
    dark: styles.buttonTextLight,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={blocked}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        void onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        buttonStyle,
        compact && styles.buttonCompact,
        fullWidth && styles.buttonFull,
        blocked && styles.buttonDisabled,
        pressed && !blocked && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "dark" ? colors.white : colors.green}
          size="small"
        />
      ) : icon ? (
        <MaterialCommunityIcons
          color={
            variant === "primary" || variant === "dark"
              ? colors.white
              : variant === "danger"
                ? colors.red
                : variant === "secondary"
                  ? colors.green
                  : colors.ink
          }
          name={icon}
          size={19}
        />
      ) : null}
      <Text style={[styles.buttonText, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  tone = "light",
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: "light" | "green" | "dark";
}) {
  const background =
    tone === "green"
      ? colors.mint
      : tone === "dark"
        ? colors.black
        : colors.surface;
  const color =
    tone === "dark" ? colors.white : tone === "green" ? colors.greenDark : colors.ink;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: background },
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons color={color} name={icon} size={21} />
    </Pressable>
  );
}

export function Field({
  label,
  helper,
  error,
  ...props
}: TextInputProps & {
  label: string;
  helper?: string;
  error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.subtle}
        selectionColor={colors.green}
        style={[
          styles.field,
          props.multiline && styles.fieldMultiline,
          error && styles.fieldError,
        ]}
        {...props}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

export function ChoiceRow({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: string; icon?: IconName }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.choiceRow}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => {
        const active = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.choice,
              active && styles.choiceActive,
              pressed && styles.pressed,
            ]}
          >
            {option.icon ? (
              <MaterialCommunityIcons
                color={active ? colors.white : colors.muted}
                name={option.icon}
                size={17}
              />
            ) : null}
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function StatusPill({
  value,
  tone,
}: {
  value: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "blue";
}) {
  const resolved =
    tone ??
    (["active", "available", "confirmed", "captured", "matched", "converted"].includes(
      value,
    )
      ? "success"
      : ["failed", "cancelled", "rejected", "expired"].includes(value)
        ? "danger"
        : ["pending_review", "payment_pending", "payment_processing", "open"].includes(
              value,
            )
          ? "warning"
          : "neutral");
  const palette = {
    success: [colors.mint, colors.greenDark],
    warning: [colors.amberSoft, "#8A5700"],
    danger: [colors.redSoft, colors.red],
    neutral: [colors.surfaceSoft, colors.muted],
    blue: [colors.blueSoft, colors.blue],
  }[resolved];
  return (
    <View style={[styles.pill, { backgroundColor: palette[0] }]}>
      <Text style={[styles.pillText, { color: palette[1] }]}>
        {titleCase(value)}
      </Text>
    </View>
  );
}

export function Metric({
  icon,
  label,
  value,
  tone = "green",
}: {
  icon: IconName;
  label: string;
  value: string;
  tone?: "green" | "blue" | "amber";
}) {
  const color =
    tone === "blue" ? colors.blue : tone === "amber" ? colors.amber : colors.green;
  return (
    <Card style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons color={color} name={icon} size={20} />
      </View>
      <Text numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

export function SectionTitle({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function DetailRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <MaterialCommunityIcons color={colors.greenDark} name={icon} size={18} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export function EmptyState({
  icon = "calendar-blank-outline",
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons color={colors.green} name={icon} size={28} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </Card>
  );
}

export function LoadingState({ label = "Loading Pllayz…" }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <Image
        contentFit="contain"
        source={require("../../assets/images/pllayz-mark.png")}
        style={styles.loadingLogo}
      />
      <ActivityIndicator color={colors.green} />
      <Text style={styles.helperText}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <EmptyState
      action={
        <Button compact label="Try again" onPress={onRetry} variant="secondary" />
      }
      icon="cloud-alert-outline"
      message={errorMessage(error)}
      title="We could not load this"
    />
  );
}

export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
}>) {
  const { width } = useWindowDimensions();
  const modalWidth = useMemo(() => Math.min(width, 620), [width]);
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={Platform.OS === "android"}
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.sheet, { maxWidth: modalWidth }]}
        >
          <SafeAreaView edges={["top", "bottom"]} style={styles.sheetSafe}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetCopy}>
                <Text style={styles.sheetTitle}>{title}</Text>
                {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
              </View>
              <IconButton icon="close" label="Close" onPress={onClose} />
            </View>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export const textStyles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.35,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  small: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  scrollContent: { flexGrow: 1 },
  screenContent: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 960,
    paddingBottom: 38,
    paddingTop: spacing.md,
    width: "100%",
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: colors.greenDark,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  pageTitle: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 620,
  },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  brandName: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadow,
  },
  greenCard: {
    backgroundColor: colors.mint,
    borderColor: "#C7ECDD",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  darkCard: {
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  softCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  amberCard: {
    backgroundColor: colors.amberSoft,
    borderColor: "#F4D99B",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 18,
  },
  buttonFull: { width: "100%" },
  buttonCompact: { minHeight: 42, paddingHorizontal: 14, width: "auto" },
  buttonPrimary: { backgroundColor: colors.green },
  buttonSecondary: {
    backgroundColor: colors.mint,
    borderColor: "#C5E9DA",
    borderWidth: 1,
  },
  buttonGhost: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonDanger: {
    backgroundColor: colors.redSoft,
    borderColor: "#F6CACA",
    borderWidth: 1,
  },
  buttonDark: { backgroundColor: colors.black },
  buttonDisabled: { opacity: 0.48 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  buttonText: { fontSize: 14, fontWeight: "800" },
  buttonTextLight: { color: colors.white },
  buttonTextGreen: { color: colors.greenDark },
  buttonTextInk: { color: colors.ink },
  buttonTextDanger: { color: colors.red },
  iconButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.2,
    color: colors.ink,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  fieldMultiline: { minHeight: 104, textAlignVertical: "top" },
  fieldError: { borderColor: colors.red },
  helperText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  errorText: { color: colors.red, fontSize: 12, lineHeight: 17 },
  choiceRow: { gap: 8, paddingRight: spacing.md },
  choice: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 39,
    paddingHorizontal: 14,
  },
  choiceActive: { backgroundColor: colors.black, borderColor: colors.black },
  choiceText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  choiceTextActive: { color: colors.white },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.35 },
  metric: { flex: 1, minWidth: 145 },
  metricIcon: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 38,
    justifyContent: "center",
    marginBottom: 13,
    width: 38,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  sectionCopy: { flex: 1 },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  sectionCaption: { color: colors.muted, fontSize: 12, marginTop: 4 },
  detailRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  detailIcon: {
    alignItems: "center",
    backgroundColor: colors.mint,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  detailCopy: { flex: 1 },
  detailLabel: { color: colors.muted, fontSize: 11, marginBottom: 2 },
  detailValue: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  emptyCard: { alignItems: "center", padding: spacing.xl },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    height: 58,
    justifyContent: "center",
    marginBottom: 14,
    width: 58,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyMessage: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 390,
    textAlign: "center",
  },
  emptyAction: { marginTop: spacing.md },
  loading: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    minHeight: 320,
  },
  loadingLogo: { height: 68, width: 68 },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: Platform.OS === "android" ? "rgba(7,17,13,0.46)" : colors.canvas,
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "94%",
    overflow: "hidden",
    width: "100%",
  },
  sheetSafe: { maxHeight: "100%" },
  sheetHeader: {
    alignItems: "flex-start",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  sheetCopy: { flex: 1 },
  sheetTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  sheetContent: { gap: spacing.md, padding: spacing.md, paddingBottom: 36 },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: 2 },
});
