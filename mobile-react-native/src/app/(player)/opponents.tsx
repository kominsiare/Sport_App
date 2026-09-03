import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { MatchCard } from "@/components/cards";
import {
  CreateMatchSheet,
  JoinMatchSheet,
} from "@/components/matchmaking-sheets";
import {
  Button,
  Card,
  ChoiceRow,
  EmptyState,
  ErrorState,
  LoadingState,
  Metric,
  Screen,
  SectionTitle,
  textStyles,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { useScreenData } from "@/hooks/use-screen-data";
import { errorMessage, isFuture } from "@/lib/format";
import { repository } from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";
import type { MatchmakingPost } from "@/lib/types";

export default function OpponentsScreen() {
  const { user } = useAuth();
  const state = useScreenData(async () => {
    const [feed, activity] = await Promise.all([
      repository.matchmakingFeed(),
      repository.bookingActivity(),
    ]);
    return { feed, activity };
  });
  const [mode, setMode] = useState("discover");
  const [city, setCity] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinPost, setJoinPost] = useState<MatchmakingPost | null>(null);
  const [busyPost, setBusyPost] = useState<string | null>(null);

  const allPosts = useMemo(() => {
    const map = new Map<string, MatchmakingPost>();
    for (const post of state.data?.feed ?? []) map.set(post.id, post);
    for (const post of state.data?.activity.posts ?? []) map.set(post.id, post);
    return [...map.values()];
  }, [state.data]);

  const discover = allPosts.filter(
    (post) =>
      post.status === "open" &&
      post.host_user_id !== user?.id &&
      (city === "All" || post.snapshot_venue_city === city),
  );
  const mine = allPosts.filter(
    (post) => post.host_user_id === user?.id || post.opponent_user_id === user?.id,
  );
  const activeBookingIds = new Set(
    allPosts
      .filter((post) => post.status === "open" || post.status === "matched")
      .map((post) => post.booking_id),
  );
  const eligibleBookings = (state.data?.activity.bookings ?? []).filter(
    (booking) =>
      booking.status === "confirmed" &&
      isFuture(booking.snapshot_start_time) &&
      !activeBookingIds.has(booking.id),
  );
  const matchedCount = mine.filter((post) => post.status === "matched").length;

  if (state.loading && !state.data) return <Screen scroll={false}><LoadingState label="Finding teams…" /></Screen>;
  if (state.error && !state.data) {
    return <Screen title="Find opponents"><ErrorState error={state.error} onRetry={() => void state.refresh()} /></Screen>;
  }

  async function createMatch(input: {
    bookingId: string;
    teamName: string;
    skill: string;
    note: string;
  }) {
    await repository.createMatchPost(input);
    await state.refresh();
    Alert.alert("Your team is live", "Another team can now join your booked court.");
  }

  async function joinMatch(input: { teamName: string; note: string }) {
    if (!joinPost) return;
    await repository.joinMatchPost({
      postId: joinPost.id,
      teamName: input.teamName,
      note: input.note,
    });
    await state.refresh();
    Alert.alert(
      "Match made",
      `Your team will play ${joinPost.host_team_name}. The host's existing booking covers the court.`,
    );
  }

  function cancelPost(post: MatchmakingPost) {
    Alert.alert(
      "Close opponent request?",
      "The court booking stays confirmed; only matchmaking closes.",
      [
        { text: "Keep open", style: "cancel" },
        {
          text: "Close request",
          style: "destructive",
          onPress: async () => {
            setBusyPost(post.id);
            try {
              await repository.cancelMatchPost(post.id);
              await state.refresh();
            } catch (error) {
              Alert.alert("Unable to close request", errorMessage(error));
            } finally {
              setBusyPost(null);
            }
          },
        },
      ],
    );
  }

  return (
    <>
      <Screen
        eyebrow="TEAM MATCHMAKING"
        onRefresh={() => void state.refresh()}
        refreshing={state.refreshing}
        subtitle="One team books the full court. Another team joins that same confirmed slot without paying again."
        title="Find opponents"
      >
        <Card style={styles.explainer} tone="dark">
          <View style={styles.explainerIcon}>
            <MaterialCommunityIcons color={colors.lime} name="account-switch-outline" size={26} />
          </View>
          <View style={styles.explainerCopy}>
            <Text style={styles.explainerTitle}>How a match works</Text>
            <Text style={styles.explainerText}>
              Host books and pays the venue → posts the team slot → opponent joins
              → both teams see the confirmed match.
            </Text>
          </View>
        </Card>

        <View style={styles.metrics}>
          <Metric
            icon="account-search-outline"
            label="Open teams"
            value={String(discover.length)}
          />
          <Metric
            icon="handshake-outline"
            label="Your matches"
            tone="blue"
            value={String(matchedCount)}
          />
        </View>

        <Button
          disabled={!eligibleBookings.length}
          icon="plus"
          label={
            eligibleBookings.length
              ? "Post my booked slot"
              : "Book a court to host a match"
          }
          onPress={() => {
            if (eligibleBookings.length) setCreateOpen(true);
            else Alert.alert(
              "A confirmed booking is required",
              "Book a future court first, then return here to find an opponent.",
            );
          }}
          variant={eligibleBookings.length ? "primary" : "secondary"}
        />

        <ChoiceRow
          onSelect={setMode}
          options={[
            { label: `Discover (${discover.length})`, value: "discover" },
            { label: `My requests & matches (${mine.length})`, value: "mine" },
          ]}
          selected={mode}
        />

        {mode === "discover" ? (
          <>
            <ChoiceRow
              onSelect={setCity}
              options={["All", "Chandigarh", "Mohali", "Panchkula"].map((value) => ({
                label: value === "All" ? "All cities" : value,
                value,
              }))}
              selected={city}
            />
            <SectionTitle
              caption="Join a team that already has a confirmed court"
              title="Teams looking now"
            />
            <View style={styles.stack}>
              {discover.map((post) => (
                <MatchCard
                  key={post.id}
                  onJoin={() => setJoinPost(post)}
                  post={post}
                />
              ))}
              {!discover.length ? (
                <EmptyState
                  action={
                    eligibleBookings.length ? (
                      <Button
                        compact
                        label="Post my slot"
                        onPress={() => setCreateOpen(true)}
                        variant="secondary"
                      />
                    ) : undefined
                  }
                  icon="account-group-outline"
                  message="No other team has an open slot in this filter yet. Pull to refresh or host one from your confirmed booking."
                  title="No open opponents"
                />
              ) : null}
            </View>
          </>
        ) : (
          <>
            <SectionTitle
              caption="Your host posts and joined opponent slots"
              title="Your team activity"
            />
            <View style={styles.stack}>
              {mine.map((post) => (
                <MatchCard
                  busy={busyPost === post.id}
                  key={post.id}
                  mine
                  onCancel={() => cancelPost(post)}
                  post={post}
                />
              ))}
              {!mine.length ? (
                <EmptyState
                  icon="account-search-outline"
                  message="Host from a confirmed booking or join another team's open slot."
                  title="No team activity yet"
                />
              ) : null}
            </View>
          </>
        )}

        <Card style={styles.safety}>
          <MaterialCommunityIcons color={colors.greenDark} name="shield-check-outline" size={22} />
          <View style={styles.safetyCopy}>
            <Text style={textStyles.label}>No duplicate court charge</Text>
            <Text style={textStyles.small}>
              Joining an opponent request only updates matchmaking. It never creates
              another hold, Razorpay order or booking.
            </Text>
          </View>
        </Card>
      </Screen>

      <CreateMatchSheet
        bookings={eligibleBookings}
        onClose={() => setCreateOpen(false)}
        onSubmit={createMatch}
        visible={createOpen}
      />
      <JoinMatchSheet
        onClose={() => setJoinPost(null)}
        onSubmit={joinMatch}
        post={joinPost}
      />
    </>
  );
}

const styles=StyleSheet.create({
  explainer:{alignItems:"center",flexDirection:"row",gap:spacing.md,padding:spacing.lg},
  explainerIcon:{alignItems:"center",backgroundColor:"rgba(207,243,106,.12)",borderRadius:radius.md,height:54,justifyContent:"center",width:54},
  explainerCopy:{flex:1},
  explainerTitle:{color:colors.white,fontSize:17,fontWeight:"900"},
  explainerText:{color:"#C9D8D1",fontSize:12,lineHeight:18,marginTop:5},
  metrics:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},
  stack:{gap:spacing.md},
  safety:{alignItems:"flex-start",flexDirection:"row",gap:spacing.sm},
  safetyCopy:{flex:1,gap:4},
});
