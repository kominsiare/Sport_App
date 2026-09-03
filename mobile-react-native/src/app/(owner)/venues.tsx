import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { VenueEditorSheet } from "@/components/owner-sheets";
import {
  Button,
  Card,
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
import { repository, type VenueDraft } from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";
import type { Venue } from "@/lib/types";

export default function OwnerVenuesScreen() {
  const state = useScreenData(repository.ownerDashboard);
  const [editor, setEditor] = useState<Venue | "new" | null>(null);

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Venues"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }

  async function saveVenue(draft: VenueDraft) {
    await repository.saveVenue(draft);
    await state.refresh();
    Alert.alert("Venue saved", draft.id ? "Your changes are live in the owner workspace." : "Add courts and availability before submitting for review.");
  }

  const selected = editor && editor !== "new" ? editor : null;
  const selectedImage = selected
    ? state.data?.images.find((image) => image.venue_id === selected.id && image.is_primary)?.public_url
    : null;

  return (
    <>
      <Screen
        action={<IconButton icon="plus" label="Add venue" onPress={() => setEditor("new")} tone="green" />}
        eyebrow="OPERATIONS"
        onRefresh={() => void state.refresh()}
        refreshing={state.refreshing}
        subtitle="Create venues, configure courts, generate slots and submit for review."
        title="Your venues"
      >
        <SectionTitle
          caption={`${state.data?.venues.length ?? 0} venues in this owner account`}
          title="Venue portfolio"
        />
        <View style={styles.stack}>
          {(state.data?.venues ?? []).map((venue) => {
            const image = state.data?.images.find(
              (item) => item.venue_id === venue.id && item.is_primary,
            );
            const courts = state.data?.courts.filter((court) => court.venue_id === venue.id) ?? [];
            const courtIds = new Set(courts.map((court) => court.id));
            const rules = state.data?.rules.filter((rule) => courtIds.has(rule.court_id)) ?? [];
            const slots = state.data?.slots.filter((slot) => courtIds.has(slot.court_id)) ?? [];
            return (
              <Card key={venue.id} style={styles.venueCard}>
                <Image
                  contentFit="cover"
                  source={
                    image?.public_url
                      ? { uri: image.public_url }
                      : require("../../../assets/images/night-match-hero.png")
                  }
                  style={styles.image}
                />
                <View style={styles.venueBody}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <Text style={styles.name}>{venue.name}</Text>
                      <Text style={textStyles.small}>{venue.area}, {venue.city}</Text>
                    </View>
                    <StatusPill value={venue.status ?? "draft"} />
                  </View>
                  <View style={styles.stats}>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{courts.length}</Text>
                      <Text style={styles.statLabel}>Courts</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{rules.length}</Text>
                      <Text style={styles.statLabel}>Rules</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{slots.length}</Text>
                      <Text style={styles.statLabel}>Future slots</Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <View style={styles.action}>
                      <Button
                        icon="pencil-outline"
                        label="Edit"
                        onPress={() => setEditor(venue)}
                        variant="ghost"
                      />
                    </View>
                    <View style={styles.action}>
                      <Button
                        icon="tune-variant"
                        label="Manage"
                        onPress={() =>
                          router.push({
                            pathname: "/owner-venue/[id]",
                            params: { id: venue.id },
                          })
                        }
                      />
                    </View>
                  </View>
                </View>
              </Card>
            );
          })}
          {!state.data?.venues.length ? (
            <EmptyState
              action={<Button compact icon="plus" label="Add first venue" onPress={() => setEditor("new")} />}
              icon="stadium-outline"
              message="Create a venue, add courts and weekly availability, then submit it for approval."
              title="No venues yet"
            />
          ) : null}
        </View>

        <Card style={styles.tip} tone="green">
          <MaterialCommunityIcons color={colors.greenDark} name="lightbulb-on-outline" size={23} />
          <View style={styles.flex}>
            <Text style={textStyles.label}>Publishing checklist</Text>
            <Text style={textStyles.small}>
              Venue details → primary image → at least one court and sport → weekly
              availability → generate slots → submit for review.
            </Text>
          </View>
        </Card>
      </Screen>

      <VenueEditorSheet
        imageUrl={selectedImage}
        onClose={() => setEditor(null)}
        onSubmit={saveVenue}
        venue={selected}
        visible={editor !== null}
      />
    </>
  );
}

const styles=StyleSheet.create({
  stack:{gap:spacing.md},
  venueCard:{overflow:"hidden",padding:0},
  image:{height:185,width:"100%"},
  venueBody:{gap:spacing.md,padding:spacing.md},
  rowBetween:{alignItems:"center",flexDirection:"row",gap:spacing.sm,justifyContent:"space-between"},
  flex:{flex:1},
  name:{color:colors.ink,fontSize:18,fontWeight:"900",letterSpacing:-.35},
  stats:{backgroundColor:colors.surfaceSoft,borderRadius:radius.md,flexDirection:"row",justifyContent:"space-around",padding:12},
  stat:{alignItems:"center"},
  statValue:{color:colors.ink,fontSize:16,fontWeight:"900"},
  statLabel:{color:colors.muted,fontSize:9,marginTop:3},
  actions:{flexDirection:"row",gap:spacing.sm},
  action:{flex:1},
  tip:{alignItems:"flex-start",flexDirection:"row",gap:spacing.sm},
});
