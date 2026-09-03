import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button, ChoiceRow, Field, Sheet, textStyles } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { spacing } from "@/lib/theme";
import type { Booking, MatchmakingPost } from "@/lib/types";

const skills = [
  { label: "Open to all", value: "open" },
  { label: "Friendly", value: "friendly" },
  { label: "Balanced", value: "balanced" },
  { label: "Competitive", value: "competitive" },
];

export function CreateMatchSheet({
  visible,
  bookings,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  bookings: Booking[];
  onClose: () => void;
  onSubmit: (input: {
    bookingId: string;
    teamName: string;
    skill: string;
    note: string;
  }) => Promise<void>;
}) {
  const [bookingId, setBookingId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [skill, setSkill] = useState("open");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setBookingId(bookings[0]?.id ?? "");
    setTeamName("");
    setSkill("open");
    setNote("");
    setError("");
  }, [bookings, visible]);

  const bookingOptions = useMemo(
    () =>
      bookings.map((booking) => ({
        label: `${booking.snapshot_sport_name} · ${formatDateTime(
          booking.snapshot_start_time,
        )}`,
        value: booking.id,
      })),
    [bookings],
  );

  async function submit() {
    if (!bookingId) {
      setError("Choose a future confirmed booking.");
      return;
    }
    if (teamName.trim().length < 2) {
      setError("Enter your team name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({ bookingId, teamName, skill, note });
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to post match.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      onClose={onClose}
      subtitle="Your booked court is shared with one opponent team. They do not make another payment."
      title="Find an opponent"
      visible={visible}
    >
      {bookings.length ? (
        <>
          <Text style={textStyles.label}>Confirmed booking</Text>
          <ChoiceRow
            onSelect={setBookingId}
            options={bookingOptions}
            selected={bookingId}
          />
          <Field
            autoCapitalize="words"
            label="Your team name"
            maxLength={80}
            onChangeText={setTeamName}
            placeholder="e.g. Chandigarh Chargers"
            value={teamName}
          />
          <Text style={textStyles.label}>Preferred level</Text>
          <ChoiceRow onSelect={setSkill} options={skills} selected={skill} />
          <Field
            label="Message (optional)"
            maxLength={240}
            multiline
            onChangeText={setNote}
            placeholder="Tell opponents about your team or match format"
            value={note}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            icon="account-search-outline"
            label="Publish opponent request"
            loading={busy}
            onPress={submit}
          />
        </>
      ) : (
        <>
          <Text style={textStyles.body}>
            You need a future confirmed booking before opening a team slot.
          </Text>
          <Button label="Got it" onPress={onClose} variant="secondary" />
        </>
      )}
    </Sheet>
  );
}

export function JoinMatchSheet({
  post,
  onClose,
  onSubmit,
}: {
  post: MatchmakingPost | null;
  onClose: () => void;
  onSubmit: (input: { teamName: string; note: string }) => Promise<void>;
}) {
  const [teamName, setTeamName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!post) return;
    setTeamName("");
    setNote("");
    setError("");
  }, [post]);

  async function submit() {
    if (teamName.trim().length < 2) {
      setError("Enter your team name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({ teamName, note });
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to join match.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      onClose={onClose}
      subtitle={
        post
          ? `Play ${post.host_team_name} at ${post.snapshot_venue_name}. The host has already paid for the court.`
          : undefined
      }
      title="Join with your team"
      visible={Boolean(post)}
    >
      <Field
        autoCapitalize="words"
        label="Your team name"
        maxLength={80}
        onChangeText={setTeamName}
        placeholder="e.g. Mohali Mavericks"
        value={teamName}
      />
      <Field
        label="Message (optional)"
        maxLength={240}
        multiline
        onChangeText={setNote}
        placeholder="Add a quick introduction"
        value={note}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        icon="handshake-outline"
        label="Confirm team match"
        loading={busy}
        onPress={submit}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  error: { color: "#D94343", fontSize: 13, lineHeight: 19 },
  stack: { gap: spacing.md },
});
