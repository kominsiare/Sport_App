import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { VenueCard } from "@/components/cards";
import {
  AnimatedEntry,
  Button,
  Card,
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
import { formatDateTime } from "@/lib/format";
import { repository } from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";

export default function PlayerHomeScreen() {
  const [now] = useState(() => Date.now());
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const state = useScreenData(async () => {
    const [catalog, activity] = await Promise.all([
      repository.catalog(),
      repository.bookingActivity(),
    ]);
    return { catalog, activity };
  });

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Home"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }

  const catalog = state.data?.catalog;
  const activity = state.data?.activity;
  const upcoming = activity?.bookings
    .filter((booking) => new Date(booking.snapshot_start_time).getTime() > now)
    .sort((a, b) => a.snapshot_start_time.localeCompare(b.snapshot_start_time))[0];
  const openMatches = activity?.posts.filter((post) => post.status === "open").length ?? 0;
  const columns = width >= 760;

  return (
    <Screen
      eyebrow={`HI, ${profile?.full_name?.split(" ")[0]?.toUpperCase() || "PLAYER"}`}
      onRefresh={() => void state.refresh()}
      refreshing={state.refreshing}
      subtitle="Live courts, confirmed games and opponent teams in one place."
      title="Ready to play?"
    >
      <AnimatedEntry delay={60}>
        <LinearGradient
          colors={["#07110D", "#10402D", "#00A86B"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.hero}
        >
          <Image
            contentFit="cover"
            source={require("../../../assets/images/night-match-hero.png")}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <MaterialCommunityIcons color={colors.lime} name="lightning-bolt" size={15} />
              <Text style={styles.heroTagText}>LIVE TRICITY SLOTS</Text>
            </View>
            <Text style={styles.heroTitle}>Book the court. Bring the game.</Text>
            <Text style={styles.heroText}>
              Reserve a verified venue with a ₹500 advance. No opponent yet? Open
              your paid slot to another team.
            </Text>
            <View style={[styles.heroActions, !columns && styles.heroActionsMobile]}>
              <View style={styles.heroAction}>
                <Button
                  icon="magnify"
                  label="Find a venue"
                  onPress={() => router.push("/(player)/venues")}
                />
              </View>
              <View style={styles.heroAction}>
                <Button
                  icon="account-search-outline"
                  label="Find opponents"
                  onPress={() => router.push("/(player)/opponents")}
                  variant="dark"
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </AnimatedEntry>

      <View style={styles.metrics}>
        <Metric
          icon="stadium-outline"
          label="Live venues"
          value={String(catalog?.venues.length ?? 0)}
        />
        <Metric
          icon="calendar-check"
          label="Confirmed games"
          tone="blue"
          value={String(activity?.bookings.length ?? 0)}
        />
        <Metric
          icon="account-search"
          label="Open team posts"
          tone="amber"
          value={String(openMatches)}
        />
      </View>

      {upcoming ? (
        <>
          <SectionTitle title="Up next" />
          <Card style={styles.upNext} tone="green">
            <View style={styles.upNextIcon}>
              <MaterialCommunityIcons color={colors.greenDark} name="calendar-star" size={24} />
            </View>
            <View style={styles.upNextCopy}>
              <Text style={styles.upNextTitle}>{upcoming.snapshot_venue_name}</Text>
              <Text style={textStyles.body}>
                {upcoming.snapshot_sport_name} · {upcoming.snapshot_court_name}
              </Text>
              <Text style={styles.upNextTime}>{formatDateTime(upcoming.snapshot_start_time)}</Text>
            </View>
            <StatusPill value={upcoming.status} />
          </Card>
        </>
      ) : null}

      <SectionTitle
        action={<Button compact fullWidth={false} label="See all" onPress={() => router.push("/(player)/venues")} variant="secondary" />}
        caption="Popular verified courts with live availability"
        title="Featured near you"
      />
      <View style={columns ? styles.venueGrid : styles.venueStack}>
        {(catalog?.venues ?? []).slice(0, columns ? 4 : 3).map((venue, index) => (
          <AnimatedEntry delay={100 + index * 55} key={venue.id} style={columns ? styles.venueCell : undefined}>
            <VenueCard
              compact={columns}
              onPress={() => router.push({ pathname: "/venue/[id]", params: { id: venue.id } })}
              venue={venue}
            />
          </AnimatedEntry>
        ))}
      </View>
    </Screen>
  );
}

const styles=StyleSheet.create({
  hero:{borderRadius:radius.xl,minHeight:360,overflow:"hidden"},
  heroImage:{height:"100%",opacity:0.58,position:"absolute",width:"100%"},
  heroOverlay:{backgroundColor:"rgba(3,12,8,0.33)",height:"100%",position:"absolute",width:"100%"},
  heroContent:{flex:1,justifyContent:"flex-end",padding:spacing.lg},
  heroTag:{alignItems:"center",alignSelf:"flex-start",backgroundColor:"rgba(0,0,0,.42)",borderRadius:radius.pill,flexDirection:"row",gap:5,marginBottom:12,paddingHorizontal:10,paddingVertical:6},
  heroTagText:{color:colors.white,fontSize:10,fontWeight:"900",letterSpacing:0.8},
  heroTitle:{color:colors.white,fontSize:31,fontWeight:"900",letterSpacing:-1,lineHeight:35,maxWidth:490},
  heroText:{color:"#DDEBE5",fontSize:13,lineHeight:20,marginTop:9,maxWidth:520},
  heroActions:{flexDirection:"row",gap:spacing.sm,marginTop:spacing.lg,maxWidth:450},
  heroActionsMobile:{maxWidth:"100%"},
  heroAction:{flex:1},
  metrics:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},
  upNext:{alignItems:"center",flexDirection:"row",gap:spacing.md},
  upNextIcon:{alignItems:"center",backgroundColor:"rgba(255,255,255,.65)",borderRadius:radius.md,height:52,justifyContent:"center",width:52},
  upNextCopy:{flex:1},
  upNextTitle:{color:colors.ink,fontSize:16,fontWeight:"900"},
  upNextTime:{color:colors.greenDark,fontSize:12,fontWeight:"800",marginTop:5},
  venueGrid:{flexDirection:"row",flexWrap:"wrap",gap:spacing.md},
  venueStack:{gap:spacing.md},
  venueCell:{minWidth:300,width:"48%"},
});
