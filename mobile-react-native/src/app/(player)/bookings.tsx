import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { BookingCard, HoldCard } from "@/components/cards";
import { CreateMatchSheet } from "@/components/matchmaking-sheets";
import { RazorpaySheet } from "@/components/razorpay-sheet";
import {
  Button,
  Card,
  ChoiceRow,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionTitle,
  StatusPill,
  textStyles,
} from "@/components/ui";
import { useScreenData } from "@/hooks/use-screen-data";
import {
  errorMessage,
  formatDateTime,
  formatMoney,
  isFuture,
  titleCase,
} from "@/lib/format";
import { repository } from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";
import type {
  BookingHold,
  PaymentOrder,
  RazorpayReturn,
} from "@/lib/types";

export default function PlayerBookingsScreen() {
  const state = useScreenData(repository.bookingActivity);
  const [mode, setMode] = useState("upcoming");
  const [busy, setBusy] = useState<{ id: string; action: "pay" | "cancel" } | null>(null);
  const [checkout, setCheckout] = useState<PaymentOrder | null>(null);
  const [checkoutHold, setCheckoutHold] = useState<BookingHold | null>(null);
  const [matchSheet, setMatchSheet] = useState(false);

  const paymentsByHold = useMemo(
    () => new Map((state.data?.payments ?? []).map((payment) => [payment.booking_hold_id, payment])),
    [state.data?.payments],
  );
  const activeHolds = (state.data?.holds ?? []).filter(
    (hold) => hold.status === "payment_pending",
  );
  const upcoming = (state.data?.bookings ?? []).filter(
    (booking) => booking.status === "confirmed" && isFuture(booking.snapshot_start_time),
  );
  const history = (state.data?.bookings ?? []).filter(
    (booking) => booking.status !== "confirmed" || !isFuture(booking.snapshot_start_time),
  );
  const activePostBookingIds = new Set(
    (state.data?.posts ?? [])
      .filter((post) => post.status === "open" || post.status === "matched")
      .map((post) => post.booking_id),
  );
  const matchmakingBookings = upcoming.filter(
    (booking) => !activePostBookingIds.has(booking.id),
  );

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Bookings"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }

  async function startPayment(hold: BookingHold) {
    setBusy({ id: hold.id, action: "pay" });
    try {
      const order = await repository.createPaymentOrder(hold.id);
      setCheckoutHold(hold);
      setCheckout(order);
    } catch (error) {
      Alert.alert("Unable to open checkout", errorMessage(error));
      void state.refresh();
    } finally {
      setBusy(null);
    }
  }

  function cancelHold(hold: BookingHold) {
    Alert.alert(
      "Release this slot?",
      "The court becomes available to other players immediately.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Release slot",
          style: "destructive",
          onPress: async () => {
            setBusy({ id: hold.id, action: "cancel" });
            try {
              await repository.cancelHold(hold.id);
              await state.refresh();
            } catch (error) {
              Alert.alert("Unable to cancel hold", errorMessage(error));
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  async function verifyPayment(response: RazorpayReturn) {
    await repository.verifyPaymentReturn(response);
    await new Promise((resolve) => setTimeout(resolve, 900));
    await state.refresh();
  }

  async function createMatch(input: {
    bookingId: string;
    teamName: string;
    skill: string;
    note: string;
  }) {
    await repository.createMatchPost(input);
    await state.refresh();
    Alert.alert("Opponent request is live", "Other teams can now join this paid slot.");
  }

  return (
    <>
      <Screen
        eyebrow="YOUR ACTIVITY"
        onRefresh={() => void state.refresh()}
        refreshing={state.refreshing}
        subtitle="Payment holds, confirmed games and booking history update from the same secure backend."
        title="Track bookings"
      >
        {activeHolds.length ? (
          <>
            <SectionTitle
              caption="Finish payment before the reservation expires"
              title="Action required"
            />
            <View style={styles.stack}>
              {activeHolds.map((hold) => (
                <HoldCard
                  busy={busy?.id === hold.id ? busy.action : null}
                  hold={hold}
                  key={hold.id}
                  onCancel={() => cancelHold(hold)}
                  onPay={() => void startPayment(hold)}
                  payment={paymentsByHold.get(hold.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        <ChoiceRow
          onSelect={setMode}
          options={[
            { label: `Upcoming (${upcoming.length})`, value: "upcoming" },
            { label: `History (${history.length})`, value: "history" },
            { label: `Payments (${state.data?.payments.length ?? 0})`, value: "payments" },
          ]}
          selected={mode}
        />

        {mode === "upcoming" ? (
          <View style={styles.stack}>
            {upcoming.map((booking) => {
              const post = state.data?.posts.find(
                (item) =>
                  item.booking_id === booking.id &&
                  (item.status === "open" || item.status === "matched"),
              );
              return (
                <BookingCard
                  action={
                    post ? (
                      <View style={styles.matchStatus}>
                        <MaterialCommunityIcons
                          color={colors.greenDark}
                          name={post.status === "matched" ? "handshake-outline" : "account-search-outline"}
                          size={18}
                        />
                        <Text style={styles.matchText}>
                          {post.status === "matched"
                            ? `Matched with ${post.opponent_team_name}`
                            : "Opponent request is live"}
                        </Text>
                      </View>
                    ) : (
                      <Button
                        icon="account-search-outline"
                        label="Find an opponent for this slot"
                        onPress={() => setMatchSheet(true)}
                        variant="secondary"
                      />
                    )
                  }
                  booking={booking}
                  key={booking.id}
                />
              );
            })}
            {!upcoming.length ? (
              <EmptyState
                action={<Button compact label="Find a venue" onPress={() => router.push("/(player)/venues")} />}
                icon="calendar-search"
                message="Your confirmed future games will appear here."
                title="No upcoming games"
              />
            ) : null}
          </View>
        ) : null}

        {mode === "history" ? (
          <View style={styles.stack}>
            {history.map((booking) => <BookingCard booking={booking} key={booking.id} />)}
            {!history.length ? (
              <EmptyState
                icon="history"
                message="Completed and cancelled bookings will stay visible here."
                title="No booking history"
              />
            ) : null}
          </View>
        ) : null}

        {mode === "payments" ? (
          <View style={styles.stack}>
            {(state.data?.payments ?? []).map((payment) => {
              const hold = state.data?.holds.find((item) => item.id === payment.booking_hold_id);
              return (
                <Card key={payment.id} style={styles.paymentCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <Text style={styles.paymentTitle}>
                        {hold?.snapshot_venue_name ?? "Venue payment"}
                      </Text>
                      <Text style={textStyles.small}>{formatDateTime(payment.created_at)}</Text>
                    </View>
                    <StatusPill value={payment.status} />
                  </View>
                  <View style={styles.paymentStrip}>
                    <View>
                      <Text style={styles.miniLabel}>Advance</Text>
                      <Text style={styles.miniValue}>
                        {formatMoney(payment.amount_subunits / 100)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.miniLabel}>Gateway</Text>
                      <Text style={styles.miniValue}>Razorpay</Text>
                    </View>
                    <View>
                      <Text style={styles.miniLabel}>State</Text>
                      <Text style={styles.miniValue}>{titleCase(payment.status)}</Text>
                    </View>
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
                message="Secure advance-payment activity will appear here."
                title="No payments yet"
              />
            ) : null}
          </View>
        ) : null}
      </Screen>

      <CreateMatchSheet
        bookings={matchmakingBookings}
        onClose={() => setMatchSheet(false)}
        onSubmit={createMatch}
        visible={matchSheet}
      />
      <RazorpaySheet
        checkout={checkout}
        hold={checkoutHold}
        onClose={() => {
          setCheckout(null);
          setCheckoutHold(null);
          void state.refresh();
        }}
        onSuccess={verifyPayment}
      />
    </>
  );
}

const styles=StyleSheet.create({
  stack:{gap:spacing.md},
  matchStatus:{alignItems:"center",backgroundColor:colors.mint,borderRadius:radius.md,flexDirection:"row",gap:8,padding:12},
  matchText:{color:colors.greenDark,flex:1,fontSize:12,fontWeight:"800"},
  paymentCard:{gap:spacing.md},
  rowBetween:{alignItems:"center",flexDirection:"row",gap:spacing.sm,justifyContent:"space-between"},
  flex:{flex:1},
  paymentTitle:{color:colors.ink,fontSize:16,fontWeight:"900"},
  paymentStrip:{backgroundColor:colors.surfaceSoft,borderRadius:radius.md,flexDirection:"row",justifyContent:"space-between",padding:12},
  miniLabel:{color:colors.muted,fontSize:9,marginBottom:3},
  miniValue:{color:colors.ink,fontSize:11,fontWeight:"800"},
  failure:{color:colors.red,fontSize:12,lineHeight:18},
});
