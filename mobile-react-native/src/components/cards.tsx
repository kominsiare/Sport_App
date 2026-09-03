import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  DetailRow,
  StatusPill,
  textStyles,
} from "@/components/ui";
import {
  formatDateTime,
  formatMoney,
  formatTime,
  titleCase,
} from "@/lib/format";
import { colors, radius, spacing } from "@/lib/theme";
import type {
  Booking,
  BookingHold,
  MatchmakingPost,
  Payment,
  Venue,
} from "@/lib/types";

export function VenueCard({
  venue,
  onPress,
  compact = false,
}: {
  venue: Venue;
  onPress: () => void;
  compact?: boolean;
}) {
  const imageSource = venue.image_url
    ? { uri: venue.image_url }
    : require("../../assets/images/night-match-hero.png");
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.venueCard}>
        <Image
          contentFit="cover"
          source={imageSource}
          style={[styles.venueImage, compact && styles.venueImageCompact]}
          transition={220}
        />
        <View style={styles.venueBody}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text numberOfLines={1} style={styles.venueName}>
                {venue.name}
              </Text>
              <Text numberOfLines={1} style={textStyles.small}>
                {venue.area}, {venue.city}
              </Text>
            </View>
            {venue.is_featured ? <StatusPill tone="success" value="Featured" /> : null}
          </View>
          <View style={styles.sportsRow}>
            {(venue.sports ?? []).slice(0, 3).map((sport) => (
              <View key={sport} style={styles.sportTag}>
                <Text style={styles.sportText}>{sport}</Text>
              </View>
            ))}
          </View>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.fromLabel}>Starts at</Text>
              <Text style={styles.price}>{formatMoney(venue.from_price)}</Text>
            </View>
            <View style={styles.openCircle}>
              <MaterialCommunityIcons
                color={colors.greenDark}
                name="arrow-top-right"
                size={20}
              />
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function BookingCard({
  booking,
  action,
}: {
  booking: Booking;
  action?: React.ReactNode;
}) {
  return (
    <Card style={styles.stack}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.venueName}>{booking.snapshot_venue_name}</Text>
          <Text style={textStyles.small}>
            {booking.snapshot_court_name} · {booking.snapshot_sport_name}
          </Text>
        </View>
        <StatusPill value={booking.status} />
      </View>
      <DetailRow
        icon="calendar-clock"
        label="Game time"
        value={formatDateTime(booking.snapshot_start_time)}
      />
      <DetailRow
        icon="cash"
        label="Total · advance paid"
        value={`${formatMoney(booking.snapshot_total_amount)} · ${formatMoney(
          booking.snapshot_advance_amount,
        )}`}
      />
      {action}
    </Card>
  );
}

export function HoldCard({
  hold,
  payment,
  onPay,
  onCancel,
  busy,
}: {
  hold: BookingHold;
  payment?: Payment;
  onPay: () => void;
  onCancel: () => void;
  busy?: "pay" | "cancel" | null;
}) {
  const processing =
    payment?.status === "order_creating" ||
    payment?.status === "payment_processing" ||
    payment?.status === "captured" ||
    payment?.status === "captured_review";
  const paymentLocked =
    payment?.status === "order_creating" ||
    payment?.status === "order_created" ||
    payment?.status === "payment_processing" ||
    payment?.status === "captured" ||
    payment?.status === "captured_review";
  return (
    <Card style={styles.stack} tone={processing ? "amber" : "default"}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.venueName}>{hold.snapshot_venue_name}</Text>
          <Text style={textStyles.small}>
            {hold.snapshot_court_name} · {hold.snapshot_sport_name}
          </Text>
        </View>
        <StatusPill value={payment?.status ?? hold.status} />
      </View>
      <DetailRow
        icon="calendar-clock"
        label="Reserved slot"
        value={formatDateTime(hold.snapshot_start_time)}
      />
      <DetailRow
        icon="timer-sand"
        label="Hold expires"
        value={formatDateTime(hold.expires_at)}
      />
      <View style={styles.notice}>
        <MaterialCommunityIcons
          color={colors.greenDark}
          name="shield-check-outline"
          size={18}
        />
        <Text style={styles.noticeText}>
          Pay {formatMoney(hold.snapshot_advance_amount)} now. The booking confirms
          only after Razorpay’s signed webhook.
        </Text>
      </View>
      {processing ? (
        <Text style={textStyles.body}>
          Payment is syncing. Do not pay again; pull to refresh for confirmation.
        </Text>
      ) : (
        <View style={styles.actionRow}>
          {!paymentLocked ? (
            <View style={styles.actionFlex}>
              <Button
                label="Cancel hold"
                loading={busy === "cancel"}
                onPress={onCancel}
                variant="ghost"
              />
            </View>
          ) : null}
          <View style={styles.actionFlex}>
            <Button
              icon="lock-check-outline"
              label={
                payment?.status === "order_created"
                  ? "Continue payment"
                  : `Pay ${formatMoney(hold.snapshot_advance_amount)}`
              }
              loading={busy === "pay"}
              onPress={onPay}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

export function MatchCard({
  post,
  mine,
  onJoin,
  onCancel,
  busy,
}: {
  post: MatchmakingPost;
  mine?: boolean;
  onJoin?: () => void;
  onCancel?: () => void;
  busy?: boolean;
}) {
  return (
    <Card style={styles.stack} tone={post.status === "matched" ? "green" : "default"}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.matchTeams}>
            {post.host_team_name}
            {post.opponent_team_name ? ` vs ${post.opponent_team_name}` : ""}
          </Text>
          <Text style={textStyles.small}>
            {post.snapshot_sport_name} · {titleCase(post.skill_level ?? "open")}
          </Text>
        </View>
        <StatusPill value={post.status} />
      </View>
      <DetailRow
        icon="stadium-outline"
        label="Venue"
        value={`${post.snapshot_venue_name}, ${post.snapshot_venue_area}`}
      />
      <DetailRow
        icon="calendar-clock"
        label="Match time"
        value={formatDateTime(post.snapshot_start_time)}
      />
      <View style={styles.matchStrip}>
        <View>
          <Text style={styles.fromLabel}>Court</Text>
          <Text style={styles.matchValue}>{post.snapshot_court_name}</Text>
        </View>
        <View>
          <Text style={styles.fromLabel}>Starts</Text>
          <Text style={styles.matchValue}>{formatTime(post.snapshot_start_time)}</Text>
        </View>
        <View>
          <Text style={styles.fromLabel}>Slot paid</Text>
          <Text style={styles.matchValue}>{formatMoney(post.snapshot_total_amount)}</Text>
        </View>
      </View>
      {post.host_note ? <Text style={textStyles.body}>“{post.host_note}”</Text> : null}
      {mine && post.status === "open" && onCancel ? (
        <Button
          label="Close opponent request"
          loading={busy}
          onPress={onCancel}
          variant="ghost"
        />
      ) : null}
      {!mine && post.status === "open" && onJoin ? (
        <Button
          icon="account-group-outline"
          label="Join with my team"
          loading={busy}
          onPress={onJoin}
        />
      ) : null}
    </Card>
  );
}

const styles=StyleSheet.create({
  pressed:{opacity:0.82,transform:[{scale:0.99}]},
  flex:{flex:1},
  stack:{gap:spacing.md},
  venueCard:{overflow:"hidden",padding:0},
  venueImage:{height:174,width:"100%"},
  venueImageCompact:{height:132},
  venueBody:{gap:spacing.md,padding:spacing.md},
  venueName:{color:colors.ink,fontSize:17,fontWeight:"900",letterSpacing:-0.3},
  rowBetween:{alignItems:"center",flexDirection:"row",gap:spacing.sm,justifyContent:"space-between"},
  sportsRow:{flexDirection:"row",flexWrap:"wrap",gap:7},
  sportTag:{backgroundColor:colors.surfaceSoft,borderRadius:radius.pill,paddingHorizontal:10,paddingVertical:5},
  sportText:{color:colors.muted,fontSize:10,fontWeight:"800"},
  fromLabel:{color:colors.muted,fontSize:10,fontWeight:"600",marginBottom:2},
  price:{color:colors.ink,fontSize:16,fontWeight:"900"},
  openCircle:{alignItems:"center",backgroundColor:colors.mint,borderRadius:radius.pill,height:40,justifyContent:"center",width:40},
  notice:{alignItems:"flex-start",backgroundColor:colors.mint,borderRadius:radius.md,flexDirection:"row",gap:9,padding:12},
  noticeText:{color:colors.greenDark,flex:1,fontSize:12,fontWeight:"600",lineHeight:18},
  actionRow:{flexDirection:"row",gap:spacing.sm},
  actionFlex:{flex:1},
  matchTeams:{color:colors.ink,fontSize:17,fontWeight:"900"},
  matchStrip:{backgroundColor:"rgba(255,255,255,0.64)",borderRadius:radius.md,flexDirection:"row",justifyContent:"space-between",padding:12},
  matchValue:{color:colors.ink,fontSize:12,fontWeight:"800"},
});
