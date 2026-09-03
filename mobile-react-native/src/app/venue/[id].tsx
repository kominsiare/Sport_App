import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

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
  textStyles,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { useScreenData } from "@/hooks/use-screen-data";
import { errorMessage, formatDate, formatMoney, formatTime } from "@/lib/format";
import { repository } from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const state = useScreenData(repository.catalog);
  const [sportId, setSportId] = useState("All");
  const [busySlot, setBusySlot] = useState<string | null>(null);

  const venue = state.data?.venues.find((item) => item.id === id);
  const courts = useMemo(
    () => (state.data?.courts ?? []).filter((court) => court.venue_id === id),
    [id, state.data?.courts],
  );
  const courtIds = useMemo(() => new Set(courts.map((court) => court.id)), [courts]);
  const supportedSportIds = useMemo(
    () =>
      new Set(
        (state.data?.courtSports ?? [])
          .filter((record) => courtIds.has(record.court_id) && record.is_active)
          .map((record) => record.sport_id),
      ),
    [courtIds, state.data?.courtSports],
  );
  const sports = useMemo(
    () => (state.data?.sports ?? []).filter((sport) => supportedSportIds.has(sport.id)),
    [state.data?.sports, supportedSportIds],
  );
  const slots = useMemo(
    () =>
      (state.data?.slots ?? [])
        .filter(
          (slot) =>
            courtIds.has(slot.court_id) &&
            (sportId === "All" || slot.sport_id === sportId),
        )
        .slice(0, 60),
    [courtIds, sportId, state.data?.slots],
  );

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Venue"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }
  if (!venue) {
    return (
      <Screen>
        <EmptyState
          action={<Button compact label="Back to venues" onPress={() => router.back()} />}
          icon="stadium-variant"
          message="This venue is no longer available in the live catalog."
          title="Venue unavailable"
        />
      </Screen>
    );
  }

  const imageSource = venue.image_url
    ? { uri: venue.image_url }
    : require("../../../assets/images/night-match-hero.png");

  async function holdSlot(slotId: string) {
    if (!profile?.can_book) {
      Alert.alert(
        "Complete verification",
        "Complete your player profile before reserving a slot.",
      );
      return;
    }
    setBusySlot(slotId);
    try {
      await repository.createHold(slotId);
      Alert.alert(
        "Slot held for you",
        "Complete the ₹500 secure advance before the hold expires.",
        [
          {
            text: "View booking",
            onPress: () => router.replace("/(player)/bookings"),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Could not hold slot", errorMessage(error));
    } finally {
      setBusySlot(null);
      void state.refresh();
    }
  }

  return (
    <Screen
      action={<IconButton icon="close" label="Close venue" onPress={() => router.back()} />}
      onRefresh={() => void state.refresh()}
      refreshing={state.refreshing}
    >
      <View style={styles.hero}>
        <Image contentFit="cover" source={imageSource} style={styles.heroImage} transition={220} />
        <View style={styles.heroShade} />
        <View style={styles.heroCopy}>
          <Text style={styles.city}>{venue.city.toUpperCase()}</Text>
          <Text style={styles.title}>{venue.name}</Text>
          <Text style={styles.location}>{venue.area} · {venue.address}</Text>
        </View>
      </View>

      <Card style={styles.priceCard}>
        <View style={styles.priceCopy}>
          <Text style={styles.priceLabel}>Slots from</Text>
          <Text style={styles.price}>{formatMoney(venue.from_price)}</Text>
        </View>
        <Button
          compact
          fullWidth={false}
          icon="map-marker-outline"
          label="Directions"
          onPress={() =>
            void Linking.openURL(
              `https://maps.google.com/?q=${venue.latitude},${venue.longitude}`,
            )
          }
          variant="secondary"
        />
      </Card>

      <Card style={styles.stack}>
        <Text style={textStyles.title}>About the venue</Text>
        <Text style={textStyles.body}>{venue.description}</Text>
        <View style={styles.details}>
          <DetailRow icon="stadium-outline" label="Courts" value={String(courts.length)} />
          <DetailRow icon="trophy-outline" label="Sports" value={(venue.sports ?? []).join(", ")} />
        </View>
        <View style={styles.amenities}>
          {(venue.amenities ?? []).map((amenity) => (
            <View key={amenity} style={styles.amenity}>
              <MaterialCommunityIcons color={colors.greenDark} name="check-circle" size={15} />
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle
        caption="Prices shown are for the full court slot"
        title="Choose a live slot"
      />
      <ChoiceRow
        onSelect={setSportId}
        options={[
          { label: "All sports", value: "All" },
          ...sports.map((sport) => ({ label: sport.name, value: sport.id })),
        ]}
        selected={sportId}
      />
      {slots.length ? (
        <View style={styles.slotStack}>
          {slots.map((slot, index) => {
            const court = courts.find((item) => item.id === slot.court_id);
            const sport = state.data?.sports.find((item) => item.id === slot.sport_id);
            const previous = slots[index - 1];
            const showDate =
              !previous || formatDate(previous.start_time) !== formatDate(slot.start_time);
            return (
              <View key={slot.id}>
                {showDate ? <Text style={styles.dateHeader}>{formatDate(slot.start_time)}</Text> : null}
                <Pressable
                  onPress={() => void holdSlot(slot.id)}
                  style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
                >
                  <View style={styles.slotTime}>
                    <Text style={styles.time}>{formatTime(slot.start_time)}</Text>
                    <Text style={styles.duration}>{slot.duration_minutes} min</Text>
                  </View>
                  <View style={styles.slotCopy}>
                    <Text style={styles.slotName}>{sport?.name ?? "Sport"}</Text>
                    <Text style={textStyles.small}>{court?.name ?? "Court"}</Text>
                  </View>
                  <View style={styles.slotPrice}>
                    <Text style={styles.slotAmount}>{formatMoney(slot.price_total)}</Text>
                    {busySlot === slot.id ? (
                      <Text style={styles.holding}>Holding…</Text>
                    ) : (
                      <MaterialCommunityIcons color={colors.green} name="arrow-right" size={20} />
                    )}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState
          icon="calendar-remove-outline"
          message="Try another sport or pull down to refresh the latest availability."
          title="No live slots"
        />
      )}
    </Screen>
  );
}

const styles=StyleSheet.create({
  hero:{borderRadius:radius.xl,height:310,justifyContent:"flex-end",overflow:"hidden"},
  heroImage:{height:"100%",position:"absolute",width:"100%"},
  heroShade:{backgroundColor:"rgba(5,14,10,.48)",height:"100%",position:"absolute",width:"100%"},
  heroCopy:{gap:5,padding:spacing.lg},
  city:{color:colors.lime,fontSize:10,fontWeight:"900",letterSpacing:1.2},
  title:{color:colors.white,fontSize:29,fontWeight:"900",letterSpacing:-0.8},
  location:{color:"#E0EAE5",fontSize:13,lineHeight:19},
  priceCard:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},
  priceCopy:{flex:1},
  priceLabel:{color:colors.muted,fontSize:11},
  price:{color:colors.ink,fontSize:22,fontWeight:"900",marginTop:3},
  stack:{gap:spacing.md},
  details:{gap:spacing.sm},
  amenities:{flexDirection:"row",flexWrap:"wrap",gap:8},
  amenity:{alignItems:"center",backgroundColor:colors.mint,borderRadius:radius.pill,flexDirection:"row",gap:5,paddingHorizontal:10,paddingVertical:6},
  amenityText:{color:colors.greenDark,fontSize:10,fontWeight:"800"},
  slotStack:{gap:8},
  dateHeader:{color:colors.ink,fontSize:14,fontWeight:"900",marginBottom:6,marginTop:10},
  slot:{alignItems:"center",backgroundColor:colors.surface,borderColor:colors.border,borderRadius:radius.md,borderWidth:1,flexDirection:"row",gap:spacing.md,minHeight:76,padding:12},
  pressed:{opacity:.75,transform:[{scale:.99}]},
  slotTime:{alignItems:"center",backgroundColor:colors.surfaceSoft,borderRadius:radius.sm,minWidth:70,padding:9},
  time:{color:colors.ink,fontSize:13,fontWeight:"900"},
  duration:{color:colors.muted,fontSize:9,marginTop:3},
  slotCopy:{flex:1},
  slotName:{color:colors.ink,fontSize:14,fontWeight:"800"},
  slotPrice:{alignItems:"flex-end",gap:5},
  slotAmount:{color:colors.ink,fontSize:13,fontWeight:"900"},
  holding:{color:colors.greenDark,fontSize:10,fontWeight:"800"},
});
