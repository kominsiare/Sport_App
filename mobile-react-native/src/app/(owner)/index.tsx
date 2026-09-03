import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Metric,
  Screen,
  SectionTitle,
  StatusPill,
  textStyles,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { useScreenData } from "@/hooks/use-screen-data";
import { formatDateTime, formatMoney, isFuture } from "@/lib/format";
import { repository } from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";

export default function OwnerDashboardScreen() {
  const { profile } = useAuth();
  const state = useScreenData(repository.ownerDashboard);

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Dashboard"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }

  const data = state.data;
  const confirmed = data?.bookings.filter((booking) => booking.status === "confirmed") ?? [];
  const upcoming = confirmed
    .filter((booking) => isFuture(booking.snapshot_start_time))
    .sort((a, b) => a.snapshot_start_time.localeCompare(b.snapshot_start_time));
  const advances = (data?.payments ?? [])
    .filter((payment) => payment.status === "captured" || payment.status === "captured_review")
    .reduce((sum, payment) => sum + payment.amount_subunits / 100, 0);
  const commission = (data?.commissions ?? []).reduce(
    (sum, item) => sum + Number(item.commission_amount),
    0,
  );
  const ownerCredit = (data?.commissions ?? []).reduce(
    (sum, item) => sum + Number(item.owner_advance_credit),
    0,
  );
  const ownerDue = (data?.commissions ?? []).reduce(
    (sum, item) => sum + Number(item.owner_due_amount),
    0,
  );
  const activeVenues = data?.venues.filter((venue) => venue.status === "active").length ?? 0;

  return (
    <Screen
      eyebrow={`${profile?.business_name?.toUpperCase() || "OWNER WORKSPACE"}`}
      onRefresh={() => void state.refresh()}
      refreshing={state.refreshing}
      subtitle="Availability, confirmed bookings, Razorpay advances and platform fees at a glance."
      title="Business overview"
    >
      <Card style={styles.hero} tone="dark">
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons color={colors.lime} name="chart-line" size={27} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroLabel}>OWNER ADVANCE CREDIT</Text>
          <Text style={styles.heroValue}>{formatMoney(ownerCredit)}</Text>
          <Text style={styles.heroText}>
            {formatMoney(advances)} collected · {formatMoney(commission)} platform fees
          </Text>
        </View>
        {ownerDue > 0 ? <StatusPill tone="warning" value={`${formatMoney(ownerDue)} due`} /> : null}
      </Card>

      <View style={styles.metrics}>
        <Metric icon="stadium-outline" label="Active venues" value={String(activeVenues)} />
        <Metric icon="calendar-check-outline" label="Confirmed bookings" tone="blue" value={String(confirmed.length)} />
        <Metric icon="cash-check" label="Captured advances" tone="amber" value={formatMoney(advances)} />
      </View>

      <View style={styles.quickActions}>
        <View style={styles.quickAction}>
          <Button
            icon="stadium-outline"
            label="Manage venues"
            onPress={() => router.push("/(owner)/venues")}
            variant="secondary"
          />
        </View>
        <View style={styles.quickAction}>
          <Button
            icon="receipt-text-outline"
            label="Payments & fees"
            onPress={() => router.push("/(owner)/activity")}
            variant="ghost"
          />
        </View>
      </View>

      <SectionTitle
        caption="Confirmed by Razorpay's signed webhook"
        title="Upcoming bookings"
      />
      <View style={styles.stack}>
        {upcoming.slice(0, 6).map((booking) => (
          <Card key={booking.id} style={styles.booking}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateDay}>
                {new Date(booking.snapshot_start_time).toLocaleDateString("en-IN", { day: "2-digit" })}
              </Text>
              <Text style={styles.dateMonth}>
                {new Date(booking.snapshot_start_time).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}
              </Text>
            </View>
            <View style={styles.bookingCopy}>
              <Text style={styles.bookingTitle}>{booking.snapshot_venue_name}</Text>
              <Text style={textStyles.small}>
                {booking.snapshot_court_name} · {booking.snapshot_sport_name}
              </Text>
              <Text style={styles.bookingTime}>{formatDateTime(booking.snapshot_start_time)}</Text>
            </View>
            <StatusPill value={booking.status} />
          </Card>
        ))}
        {!upcoming.length ? (
          <EmptyState
            icon="calendar-blank-outline"
            message="Confirmed player bookings will appear here automatically."
            title="No upcoming bookings"
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles=StyleSheet.create({
  hero:{alignItems:"center",flexDirection:"row",gap:spacing.md,padding:spacing.lg},
  heroIcon:{alignItems:"center",backgroundColor:"rgba(207,243,106,.12)",borderRadius:radius.md,height:56,justifyContent:"center",width:56},
  heroCopy:{flex:1},
  heroLabel:{color:"#9DB0A7",fontSize:9,fontWeight:"900",letterSpacing:1},
  heroValue:{color:colors.white,fontSize:29,fontWeight:"900",letterSpacing:-1,marginTop:3},
  heroText:{color:"#C7D7D0",fontSize:11,marginTop:4},
  metrics:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},
  quickActions:{flexDirection:"row",gap:spacing.sm},
  quickAction:{flex:1},
  stack:{gap:spacing.sm},
  booking:{alignItems:"center",flexDirection:"row",gap:spacing.md},
  dateBlock:{alignItems:"center",backgroundColor:colors.mint,borderRadius:radius.md,minWidth:52,padding:9},
  dateDay:{color:colors.greenDark,fontSize:19,fontWeight:"900"},
  dateMonth:{color:colors.greenDark,fontSize:9,fontWeight:"800"},
  bookingCopy:{flex:1},
  bookingTitle:{color:colors.ink,fontSize:15,fontWeight:"900"},
  bookingTime:{color:colors.greenDark,fontSize:11,fontWeight:"800",marginTop:4},
});
