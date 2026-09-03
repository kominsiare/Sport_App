import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  CourtEditorSheet,
  RuleEditorSheet,
  VenueEditorSheet,
} from "@/components/owner-sheets";
import {
  Button,
  Card,
  ChoiceRow,
  DetailRow,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Screen,
  SectionTitle,
  StatusPill,
  textStyles,
} from "@/components/ui";
import { useScreenData } from "@/hooks/use-screen-data";
import { errorMessage, formatDateTime, formatMoney, formatTime } from "@/lib/format";
import {
  repository,
  type CourtDraft,
  type RuleDraft,
  type VenueDraft,
} from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";
import type { Court } from "@/lib/types";

const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function OwnerVenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useScreenData(repository.ownerDashboard);
  const [mode, setMode] = useState("overview");
  const [editVenue, setEditVenue] = useState(false);
  const [courtEditor, setCourtEditor] = useState<Court | "new" | null>(null);
  const [ruleEditor, setRuleEditor] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const venue = state.data?.venues.find((item) => item.id === id);
  const image = state.data?.images.find(
    (item) => item.venue_id === id && item.is_primary,
  );
  const approval = state.data?.approvals.find((item) => item.venue_id === id);
  const courts = useMemo(
    () => (state.data?.courts ?? []).filter((court) => court.venue_id === id),
    [id, state.data?.courts],
  );
  const courtIds = useMemo(() => new Set(courts.map((court) => court.id)), [courts]);
  const rules = (state.data?.rules ?? []).filter((rule) => courtIds.has(rule.court_id));
  const slots = (state.data?.slots ?? []).filter((slot) => courtIds.has(slot.court_id));
  const activeSlots = slots.filter((slot) => slot.status === "available").length;
  const blockedSlots = slots.filter((slot) => slot.status === "blocked").length;
  const venueBookings = (state.data?.bookings ?? []).filter((booking) => booking.venue_id === id);

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Venue operations"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }
  if (!venue) {
    return (
      <Screen>
        <EmptyState
          action={<Button compact label="Back to venues" onPress={() => router.replace("/(owner)/venues")} />}
          icon="stadium-variant"
          message="This venue is not part of your owner account."
          title="Venue unavailable"
        />
      </Screen>
    );
  }

  async function saveVenue(draft: VenueDraft) {
    await repository.saveVenue(draft);
    await state.refresh();
  }

  async function saveCourt(draft: CourtDraft) {
    await repository.saveCourt(draft);
    await state.refresh();
    Alert.alert("Court saved", "Supported sports are ready for availability rules.");
  }

  async function saveRule(draft: RuleDraft) {
    await repository.saveRule(draft);
    await repository.refreshVenueSlots(id);
    await state.refresh();
    Alert.alert("Availability added", "Future slots have been regenerated.");
  }

  async function runAction(key: string, action: () => Promise<void>, success: string) {
    setBusy(key);
    try {
      await action();
      await state.refresh();
      Alert.alert("Done", success);
    } catch (error) {
      Alert.alert("Action could not be completed", errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  function deleteVenue() {
    Alert.alert(
      "Delete this venue?",
      "This is only allowed for an unused draft. Existing bookings and financial data are always preserved.",
      [
        { text: "Keep venue", style: "cancel" },
        {
          text: "Delete draft",
          style: "destructive",
          onPress: () =>
            void runAction(
              "delete",
              async () => {
                await repository.deleteVenue(id);
                router.replace("/(owner)/venues");
              },
              "Draft venue deleted.",
            ),
        },
      ],
    );
  }

  return (
    <>
      <Screen
        action={<IconButton icon="close" label="Back to venues" onPress={() => router.back()} />}
        onRefresh={() => void state.refresh()}
        refreshing={state.refreshing}
      >
        <View style={styles.hero}>
          <Image
            contentFit="cover"
            source={
              image?.public_url
                ? { uri: image.public_url }
                : require("../../../assets/images/night-match-hero.png")
            }
            style={styles.heroImage}
          />
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            <StatusPill value={venue.status ?? "draft"} />
            <Text style={styles.heroTitle}>{venue.name}</Text>
            <Text style={styles.heroText}>{venue.area}, {venue.city}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.action}>
            <Button icon="pencil-outline" label="Edit details" onPress={() => setEditVenue(true)} variant="ghost" />
          </View>
          <View style={styles.action}>
            <Button
              icon="refresh"
              label="Generate slots"
              loading={busy === "refresh"}
              onPress={() =>
                runAction(
                  "refresh",
                  () => repository.refreshVenueSlots(id),
                  "The next seven days of slots were refreshed.",
                )
              }
              variant="secondary"
            />
          </View>
        </View>

        <ChoiceRow
          onSelect={setMode}
          options={[
            { label: "Overview", value: "overview" },
            { label: `Courts (${courts.length})`, value: "courts" },
            { label: `Availability (${rules.length})`, value: "rules" },
            { label: `Slots (${slots.length})`, value: "slots" },
          ]}
          selected={mode}
        />

        {mode === "overview" ? (
          <>
            <View style={styles.metrics}>
              <Card style={styles.metric}><Text style={styles.metricValue}>{activeSlots}</Text><Text style={styles.metricLabel}>Available slots</Text></Card>
              <Card style={styles.metric}><Text style={styles.metricValue}>{venueBookings.length}</Text><Text style={styles.metricLabel}>Bookings</Text></Card>
              <Card style={styles.metric}><Text style={styles.metricValue}>{blockedSlots}</Text><Text style={styles.metricLabel}>Blocked</Text></Card>
            </View>
            <Card style={styles.stack}>
              <Text style={textStyles.title}>Venue readiness</Text>
              <DetailRow icon="image-outline" label="Primary photo" value={image ? "Added" : "Missing"} />
              <DetailRow icon="stadium-outline" label="Courts" value={courts.length ? `${courts.length} configured` : "Add a court"} />
              <DetailRow icon="calendar-sync-outline" label="Weekly rules" value={rules.length ? `${rules.length} active or paused` : "Add availability"} />
              <DetailRow icon="check-decagram-outline" label="Review" value={approval?.decision ?? "Not submitted"} />
              {approval?.review_note ? (
                <Card tone="amber"><Text style={textStyles.label}>Review note</Text><Text style={textStyles.body}>{approval.review_note}</Text></Card>
              ) : null}
            </Card>
            <Button
              disabled={!courts.length || !rules.length || venue.status === "pending_review" || venue.status === "active"}
              icon="send-check-outline"
              label={
                venue.status === "pending_review"
                  ? "Awaiting review"
                  : venue.status === "active"
                    ? "Venue is active"
                    : "Submit for review"
              }
              loading={busy === "submit"}
              onPress={() =>
                runAction(
                  "submit",
                  () => repository.submitVenue(id),
                  "Venue submitted for admin review.",
                )
              }
            />
          </>
        ) : null}

        {mode === "courts" ? (
          <>
            <SectionTitle
              action={<Button compact fullWidth={false} icon="plus" label="Add court" onPress={() => setCourtEditor("new")} />}
              caption="Each court can support one or more sports"
              title="Courts"
            />
            <View style={styles.stack}>
              {courts.map((court) => {
                const sportNames = (state.data?.courtSports ?? [])
                  .filter((record) => record.court_id === court.id && record.is_active)
                  .map((record) => state.data?.sports.find((sport) => sport.id === record.sport_id)?.name)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <Card key={court.id} style={styles.court}>
                    <View style={styles.courtIcon}>
                      <MaterialCommunityIcons color={colors.greenDark} name="texture-box" size={22} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.itemTitle}>{court.name}</Text>
                      <Text style={textStyles.small}>{court.court_type} · {sportNames || "No sport"}</Text>
                      <Text style={styles.itemMeta}>
                        {court.default_duration_minutes ?? 60} min · from {formatMoney(court.base_price)}
                      </Text>
                    </View>
                    <IconButton icon="pencil-outline" label="Edit court" onPress={() => setCourtEditor(court)} />
                  </Card>
                );
              })}
              {!courts.length ? (
                <EmptyState
                  action={<Button compact label="Add a court" onPress={() => setCourtEditor("new")} />}
                  icon="texture-box"
                  message="Courts connect sports, weekly rules and live slots."
                  title="No courts configured"
                />
              ) : null}
            </View>
          </>
        ) : null}

        {mode === "rules" ? (
          <>
            <SectionTitle
              action={<Button compact disabled={!courts.length} fullWidth={false} icon="plus" label="Add rule" onPress={() => setRuleEditor(true)} />}
              caption="Active rules generate the next seven days of slots"
              title="Weekly availability"
            />
            <View style={styles.stack}>
              {rules.map((rule) => {
                const court = courts.find((item) => item.id === rule.court_id);
                const sport = state.data?.sports.find((item) => item.id === rule.sport_id);
                return (
                  <Card key={rule.id} style={styles.rule}>
                    <View style={styles.day}>
                      <Text style={styles.dayText}>{weekday[rule.weekday]}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.itemTitle}>{court?.name} · {sport?.name}</Text>
                      <Text style={textStyles.small}>
                        {rule.start_local.slice(0, 5)}–{rule.end_local.slice(0, 5)} · {rule.duration_minutes} min
                      </Text>
                      <Text style={styles.itemMeta}>{formatMoney(rule.price_total)} per slot</Text>
                    </View>
                    <StatusPill value={rule.is_active ? "active" : "paused"} />
                    <View style={styles.ruleActions}>
                      <IconButton
                        icon={rule.is_active ? "pause" : "play"}
                        label={rule.is_active ? "Pause rule" : "Activate rule"}
                        onPress={() =>
                          void runAction(
                            `rule-${rule.id}`,
                            async () => {
                              await repository.toggleRule(rule.id, !rule.is_active);
                              await repository.refreshVenueSlots(id);
                            },
                            rule.is_active ? "Availability paused." : "Availability activated.",
                          )
                        }
                      />
                      <IconButton
                        icon="trash-can-outline"
                        label="Delete rule"
                        onPress={() =>
                          Alert.alert("Delete weekly rule?", "Future unbooked slots will be regenerated.", [
                            { text: "Keep rule", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () =>
                                void runAction(
                                  `delete-rule-${rule.id}`,
                                  async () => {
                                    await repository.deleteRule(rule.id);
                                    await repository.refreshVenueSlots(id);
                                  },
                                  "Weekly rule deleted.",
                                ),
                            },
                          ])
                        }
                      />
                    </View>
                  </Card>
                );
              })}
              {!rules.length ? (
                <EmptyState
                  action={courts.length ? <Button compact label="Add availability" onPress={() => setRuleEditor(true)} /> : undefined}
                  icon="calendar-sync-outline"
                  message="Add weekly hours and pricing, then Pllayz will generate live slots."
                  title="No availability rules"
                />
              ) : null}
            </View>
          </>
        ) : null}

        {mode === "slots" ? (
          <>
            <SectionTitle
              caption="Block only genuinely unavailable times; booked slots cannot be changed"
              title="Next seven days"
            />
            <View style={styles.stack}>
              {slots.slice(0, 80).map((slot) => {
                const court = courts.find((item) => item.id === slot.court_id);
                const sport = state.data?.sports.find((item) => item.id === slot.sport_id);
                const canToggle = slot.status === "available" || slot.status === "blocked";
                return (
                  <Card key={slot.id} style={styles.slot}>
                    <View style={styles.slotTime}>
                      <Text style={styles.slotHour}>{formatTime(slot.start_time)}</Text>
                      <Text style={styles.slotDate}>
                        {new Date(slot.start_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.itemTitle}>{court?.name} · {sport?.name}</Text>
                      <Text style={textStyles.small}>{formatDateTime(slot.start_time)} · {formatMoney(slot.price_total)}</Text>
                      {slot.owner_block_reason ? <Text style={styles.blockReason}>{slot.owner_block_reason}</Text> : null}
                    </View>
                    <View style={styles.slotAction}>
                      <StatusPill value={slot.status} />
                      {canToggle ? (
                        <Button
                          compact
                          fullWidth={false}
                          label={slot.status === "blocked" ? "Unblock" : "Block"}
                          loading={busy === `slot-${slot.id}`}
                          onPress={() =>
                            void runAction(
                              `slot-${slot.id}`,
                              () => repository.blockSlot(slot.id, slot.status !== "blocked"),
                              slot.status === "blocked" ? "Slot is available again." : "Slot blocked.",
                            )
                          }
                          variant="ghost"
                        />
                      ) : null}
                    </View>
                  </Card>
                );
              })}
              {!slots.length ? (
                <EmptyState
                  action={<Button compact label="Generate slots" onPress={() => void runAction("refresh", () => repository.refreshVenueSlots(id), "Slots generated.")} />}
                  icon="calendar-remove-outline"
                  message="Add an active weekly rule, then generate the next seven days."
                  title="No future slots"
                />
              ) : null}
            </View>
          </>
        ) : null}

        {venue.status === "draft" && !venueBookings.length ? (
          <Card style={styles.dangerZone}>
            <View style={styles.flex}>
              <Text style={styles.dangerTitle}>Delete unused draft</Text>
              <Text style={textStyles.small}>Deletion is blocked once operational data exists.</Text>
            </View>
            <Button compact fullWidth={false} label="Delete" loading={busy === "delete"} onPress={deleteVenue} variant="danger" />
          </Card>
        ) : null}
      </Screen>

      <VenueEditorSheet
        imageUrl={image?.public_url}
        onClose={() => setEditVenue(false)}
        onSubmit={saveVenue}
        venue={venue}
        visible={editVenue}
      />
      <CourtEditorSheet
        court={courtEditor && courtEditor !== "new" ? courtEditor : null}
        courtSports={state.data?.courtSports ?? []}
        onClose={() => setCourtEditor(null)}
        onSubmit={saveCourt}
        sports={state.data?.sports ?? []}
        venueId={id}
        visible={courtEditor !== null}
      />
      <RuleEditorSheet
        courtSports={state.data?.courtSports ?? []}
        courts={courts}
        onClose={() => setRuleEditor(false)}
        onSubmit={saveRule}
        sports={state.data?.sports ?? []}
        visible={ruleEditor}
      />
    </>
  );
}

const styles=StyleSheet.create({
  hero:{borderRadius:radius.xl,height:260,justifyContent:"flex-end",overflow:"hidden"},
  heroImage:{height:"100%",position:"absolute",width:"100%"},
  heroShade:{backgroundColor:"rgba(4,13,9,.5)",height:"100%",position:"absolute",width:"100%"},
  heroContent:{alignItems:"flex-start",gap:7,padding:spacing.lg},
  heroTitle:{color:colors.white,fontSize:28,fontWeight:"900",letterSpacing:-.8},
  heroText:{color:"#DCE9E3",fontSize:13},
  actions:{flexDirection:"row",gap:spacing.sm},
  action:{flex:1},
  metrics:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},
  metric:{flex:1,minWidth:100},
  metricValue:{color:colors.ink,fontSize:23,fontWeight:"900"},
  metricLabel:{color:colors.muted,fontSize:10,marginTop:4},
  stack:{gap:spacing.sm},
  court:{alignItems:"center",flexDirection:"row",gap:spacing.sm},
  courtIcon:{alignItems:"center",backgroundColor:colors.mint,borderRadius:radius.md,height:48,justifyContent:"center",width:48},
  flex:{flex:1},
  itemTitle:{color:colors.ink,fontSize:14,fontWeight:"900"},
  itemMeta:{color:colors.greenDark,fontSize:11,fontWeight:"800",marginTop:4},
  rule:{alignItems:"center",flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},
  day:{alignItems:"center",backgroundColor:colors.black,borderRadius:radius.sm,justifyContent:"center",minHeight:44,minWidth:44},
  dayText:{color:colors.white,fontSize:11,fontWeight:"900"},
  ruleActions:{flexDirection:"row",gap:6,width:"100%"},
  slot:{alignItems:"center",flexDirection:"row",gap:spacing.sm},
  slotTime:{alignItems:"center",backgroundColor:colors.surfaceSoft,borderRadius:radius.sm,minWidth:61,padding:8},
  slotHour:{color:colors.ink,fontSize:12,fontWeight:"900"},
  slotDate:{color:colors.muted,fontSize:9,marginTop:3},
  slotAction:{alignItems:"flex-end",gap:7},
  blockReason:{color:colors.red,fontSize:10,marginTop:4},
  dangerZone:{alignItems:"center",borderColor:"#F4CECE",flexDirection:"row",gap:spacing.md},
  dangerTitle:{color:colors.red,fontSize:14,fontWeight:"900"},
});
