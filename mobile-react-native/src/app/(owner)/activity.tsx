import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Card,
  ChoiceRow,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  StatusPill,
  textStyles,
} from "@/components/ui";
import { useScreenData } from "@/hooks/use-screen-data";
import {
  formatDateTime,
  formatMoney,
  titleCase,
} from "@/lib/format";
import { repository } from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";

export default function OwnerActivityScreen() {
  const state = useScreenData(repository.ownerDashboard);
  const [mode, setMode] = useState("bookings");

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Activity"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }

  return (
    <Screen
      eyebrow="READ-ONLY LEDGER"
      onRefresh={() => void state.refresh()}
      refreshing={state.refreshing}
      subtitle="Webhook-confirmed bookings, Razorpay advances, commission records and operational changes."
      title="Payments & activity"
    >
      <ChoiceRow
        onSelect={setMode}
        options={[
          { label: `Bookings (${state.data?.bookings.length ?? 0})`, value: "bookings" },
          { label: `Payments (${state.data?.payments.length ?? 0})`, value: "payments" },
          { label: `Fees (${state.data?.commissions.length ?? 0})`, value: "fees" },
          { label: `Operations (${state.data?.logs.length ?? 0})`, value: "logs" },
        ]}
        selected={mode}
      />

      {mode === "bookings" ? (
        <View style={styles.stack}>
          {(state.data?.bookings ?? []).map((booking) => (
            <Card key={booking.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.title}>{booking.snapshot_venue_name}</Text>
                  <Text style={textStyles.small}>
                    {booking.snapshot_court_name} · {booking.snapshot_sport_name}
                  </Text>
                </View>
                <StatusPill value={booking.status} />
              </View>
              <View style={styles.strip}>
                <Value label="Game time" value={formatDateTime(booking.snapshot_start_time)} />
                <Value label="Full slot" value={formatMoney(booking.snapshot_total_amount)} />
                <Value label="Advance" value={formatMoney(booking.snapshot_advance_amount)} />
              </View>
            </Card>
          ))}
          {!state.data?.bookings.length ? (
            <EmptyState
              icon="calendar-blank-outline"
              message="Only webhook-confirmed bookings appear in this ledger."
              title="No confirmed bookings"
            />
          ) : null}
        </View>
      ) : null}

      {mode === "payments" ? (
        <View style={styles.stack}>
          {(state.data?.payments ?? []).map((payment) => {
            const hold = state.data?.holds.find((item) => item.id === payment.booking_hold_id);
            return (
              <Card key={payment.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex}>
                    <Text style={styles.title}>{hold?.snapshot_venue_name ?? "Venue advance"}</Text>
                    <Text style={textStyles.small}>{formatDateTime(payment.created_at)}</Text>
                  </View>
                  <StatusPill value={payment.status} />
                </View>
                <View style={styles.strip}>
                  <Value label="Amount" value={formatMoney(payment.amount_subunits / 100)} />
                  <Value label="Currency" value={payment.currency} />
                  <Value
                    label="Payment ID"
                    value={payment.razorpay_payment_id ? `…${payment.razorpay_payment_id.slice(-8)}` : "Pending"}
                  />
                </View>
                {payment.failure_description ? (
                  <Text style={styles.failure}>{payment.failure_description}</Text>
                ) : null}
              </Card>
            );
          })}
          {!state.data?.payments.length ? (
            <EmptyState
              icon="credit-card-clock-outline"
              message="Razorpay order and payment states will appear here."
              title="No payment activity"
            />
          ) : null}
        </View>
      ) : null}

      {mode === "fees" ? (
        <View style={styles.stack}>
          {(state.data?.commissions ?? []).map((fee) => (
            <Card key={fee.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.feeIcon}>
                  <MaterialCommunityIcons color={colors.greenDark} name="percent-outline" size={22} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.title}>Platform fee {Math.round(fee.commission_rate * 100)}%</Text>
                  <Text style={textStyles.small}>{formatDateTime(fee.created_at)}</Text>
                </View>
                <StatusPill
                  tone={Number(fee.owner_due_amount) > 0 ? "warning" : "success"}
                  value={fee.collection_status}
                />
              </View>
              <View style={styles.strip}>
                <Value label="Booking total" value={formatMoney(fee.total_booking_amount)} />
                <Value label="Platform fee" value={formatMoney(fee.commission_amount)} />
                <Value label="Owner credit" value={formatMoney(fee.owner_advance_credit)} />
              </View>
              {Number(fee.owner_due_amount) > 0 ? (
                <View style={styles.due}>
                  <Text style={styles.dueText}>Owner due: {formatMoney(fee.owner_due_amount)}</Text>
                </View>
              ) : null}
            </Card>
          ))}
          {!state.data?.commissions.length ? (
            <EmptyState
              icon="percent-outline"
              message="A commission record is created with every captured booking."
              title="No platform fees"
            />
          ) : null}
        </View>
      ) : null}

      {mode === "logs" ? (
        <View style={styles.timeline}>
          {(state.data?.logs ?? []).map((log, index) => (
            <View key={log.id} style={styles.logRow}>
              <View style={styles.timelineRail}>
                <View style={styles.timelineDot} />
                {index < (state.data?.logs.length ?? 0) - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <Card style={styles.logCard}>
                <Text style={styles.title}>{titleCase(log.action)}</Text>
                <Text style={textStyles.small}>{formatDateTime(log.created_at)}</Text>
                {Object.keys(log.details ?? {}).length ? (
                  <Text numberOfLines={3} style={styles.details}>
                    {JSON.stringify(log.details)}
                  </Text>
                ) : null}
              </Card>
            </View>
          ))}
          {!state.data?.logs.length ? (
            <EmptyState
              icon="clipboard-text-clock-outline"
              message="Venue, court, availability and slot changes are logged here."
              title="No operational changes"
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.value}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.valueText}>{value}</Text>
    </View>
  );
}

const styles=StyleSheet.create({
  stack:{gap:spacing.md},
  card:{gap:spacing.md},
  rowBetween:{alignItems:"center",flexDirection:"row",gap:spacing.sm,justifyContent:"space-between"},
  flex:{flex:1},
  title:{color:colors.ink,fontSize:15,fontWeight:"900"},
  strip:{backgroundColor:colors.surfaceSoft,borderRadius:radius.md,flexDirection:"row",gap:8,padding:12},
  value:{flex:1},
  valueLabel:{color:colors.muted,fontSize:9,marginBottom:4},
  valueText:{color:colors.ink,fontSize:11,fontWeight:"800"},
  failure:{color:colors.red,fontSize:12},
  feeIcon:{alignItems:"center",backgroundColor:colors.mint,borderRadius:radius.md,height:46,justifyContent:"center",width:46},
  due:{backgroundColor:colors.amberSoft,borderRadius:radius.sm,padding:10},
  dueText:{color:"#8A5700",fontSize:11,fontWeight:"800"},
  timeline:{gap:0},
  logRow:{alignItems:"stretch",flexDirection:"row",gap:10},
  timelineRail:{alignItems:"center",width:14},
  timelineDot:{backgroundColor:colors.green,borderColor:colors.mint,borderRadius:6,borderWidth:3,height:12,marginTop:20,width:12},
  timelineLine:{backgroundColor:colors.border,flex:1,width:2},
  logCard:{flex:1,gap:4,marginBottom:spacing.sm},
  details:{color:colors.muted,fontFamily:"monospace",fontSize:9,lineHeight:14,marginTop:6},
});
