import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { VenueCard } from "@/components/cards";
import {
  ChoiceRow,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Screen,
} from "@/components/ui";
import { useScreenData } from "@/hooks/use-screen-data";
import { repository } from "@/lib/repository";
import { spacing } from "@/lib/theme";

export default function PlayerVenuesScreen() {
  const state = useScreenData(repository.catalog);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All");
  const [sport, setSport] = useState("All");

  const venues = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (state.data?.venues ?? []).filter((venue) => {
      const searchable = `${venue.name} ${venue.area} ${venue.city} ${venue.sports?.join(" ")}`.toLowerCase();
      return (
        (!needle || searchable.includes(needle)) &&
        (city === "All" || venue.city === city) &&
        (sport === "All" || venue.sports?.includes(sport))
      );
    });
  }, [city, query, sport, state.data?.venues]);

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Venues"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }

  return (
    <Screen
      eyebrow="DISCOVER"
      onRefresh={() => void state.refresh()}
      refreshing={state.refreshing}
      subtitle="Compare verified courts, sports, prices and live slots."
      title="Find your ground"
    >
      <Field
        label="Search venues"
        onChangeText={setQuery}
        placeholder="Name, area or sport"
        returnKeyType="search"
        value={query}
      />
      <ChoiceRow
        onSelect={setCity}
        options={["All", "Chandigarh", "Mohali", "Panchkula"].map((value) => ({
          label: value === "All" ? "All cities" : value,
          value,
        }))}
        selected={city}
      />
      <ChoiceRow
        onSelect={setSport}
        options={[
          { label: "All sports", value: "All" },
          ...(state.data?.sports ?? []).map((item) => ({
            label: item.name,
            value: item.name,
          })),
        ]}
        selected={sport}
      />
      <View style={styles.resultHeader}>
        <Text style={styles.resultText}>{venues.length} venues available</Text>
      </View>
      <View style={styles.stack}>
        {venues.map((venue) => (
          <VenueCard
            key={venue.id}
            onPress={() => router.push({ pathname: "/venue/[id]", params: { id: venue.id } })}
            venue={venue}
          />
        ))}
        {!venues.length ? (
          <EmptyState
            icon="stadium-variant"
            message="Try another city, sport or search term."
            title="No venues match"
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles=StyleSheet.create({
  resultHeader:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},
  resultText:{color:"#66736E",fontSize:12,fontWeight:"700"},
  stack:{gap:spacing.md},
});
