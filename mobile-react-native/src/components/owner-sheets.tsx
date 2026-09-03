import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ChoiceRow,
  Field,
  Sheet,
  textStyles,
} from "@/components/ui";
import type { CourtDraft, RuleDraft, VenueDraft } from "@/lib/repository";
import { colors, radius, spacing } from "@/lib/theme";
import type {
  Court,
  CourtSport,
  Sport,
  Venue,
} from "@/lib/types";

export function VenueEditorSheet({
  visible,
  venue,
  imageUrl,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  venue?: Venue | null;
  imageUrl?: string | null;
  onClose: () => void;
  onSubmit: (draft: VenueDraft) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("Chandigarh");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("30.7333");
  const [longitude, setLongitude] = useState("76.7794");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [photo, setPhoto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setName(venue?.name ?? "");
    setCity(venue?.city ?? "Chandigarh");
    setArea(venue?.area ?? "");
    setAddress(venue?.address ?? "");
    setLatitude(String(venue?.latitude ?? 30.7333));
    setLongitude(String(venue?.longitude ?? 76.7794));
    setDescription(venue?.description ?? "");
    setAmenities((venue?.amenities ?? []).join(", "));
    setPhoto(imageUrl ?? "");
    setError("");
  }, [imageUrl, venue, visible]);

  async function submit() {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      name.trim().length < 3 ||
      area.trim().length < 2 ||
      address.trim().length < 5 ||
      description.trim().length < 20 ||
      !photo.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setError("Complete the venue, location, description and photo URL.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        id: venue?.id,
        name,
        city,
        area,
        address,
        latitude: lat,
        longitude: lng,
        description,
        amenities: amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        imageUrl: photo,
      });
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save venue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      onClose={onClose}
      subtitle="Draft details remain private until you submit the venue for review."
      title={venue ? "Edit venue" : "Add a venue"}
      visible={visible}
    >
      <Field autoCapitalize="words" label="Venue name" onChangeText={setName} value={name} />
      <Text style={textStyles.label}>City</Text>
      <ChoiceRow
        onSelect={setCity}
        options={["Chandigarh", "Mohali", "Panchkula"].map((value) => ({ label: value, value }))}
        selected={city}
      />
      <Field autoCapitalize="words" label="Area" onChangeText={setArea} value={area} />
      <Field
        autoCapitalize="words"
        label="Full address"
        multiline
        onChangeText={setAddress}
        value={address}
      />
      <View style={styles.twoColumns}>
        <View style={styles.flex}>
          <Field
            keyboardType="decimal-pad"
            label="Latitude"
            onChangeText={setLatitude}
            value={latitude}
          />
        </View>
        <View style={styles.flex}>
          <Field
            keyboardType="decimal-pad"
            label="Longitude"
            onChangeText={setLongitude}
            value={longitude}
          />
        </View>
      </View>
      <Field
        label="Description"
        maxLength={1200}
        multiline
        onChangeText={setDescription}
        value={description}
      />
      <Field
        helper="Separate items with commas"
        label="Amenities"
        onChangeText={setAmenities}
        placeholder="Parking, floodlights, changing room"
        value={amenities}
      />
      <Field
        autoCapitalize="none"
        keyboardType="url"
        label="Primary photo URL"
        onChangeText={setPhoto}
        placeholder="https://…"
        value={photo}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button icon="content-save-outline" label="Save venue" loading={busy} onPress={submit} />
    </Sheet>
  );
}

function MultiSports({
  sports,
  selected,
  onChange,
}: {
  sports: Sport[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <View style={styles.wrap}>
      {sports.map((sport) => {
        const active = selected.includes(sport.id);
        return (
          <Pressable
            key={sport.id}
            onPress={() =>
              onChange(
                active
                  ? selected.filter((id) => id !== sport.id)
                  : [...selected, sport.id],
              )
            }
            style={({ pressed }) => [
              styles.multiChoice,
              active && styles.multiChoiceActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              color={active ? colors.white : colors.muted}
              name={active ? "check-circle" : "circle-outline"}
              size={16}
            />
            <Text style={[styles.multiText, active && styles.multiTextActive]}>
              {sport.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CourtEditorSheet({
  visible,
  venueId,
  court,
  sports,
  courtSports,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  venueId: string;
  court?: Court | null;
  sports: Sport[];
  courtSports: CourtSport[];
  onClose: () => void;
  onSubmit: (draft: CourtDraft) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Outdoor turf");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("1200");
  const [sportIds, setSportIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setName(court?.name ?? "");
    setType(court?.court_type ?? "Outdoor turf");
    setDuration(String(court?.default_duration_minutes ?? 60));
    setPrice(String(court?.base_price ?? 1200));
    setSportIds(
      court
        ? courtSports
            .filter((record) => record.court_id === court.id && record.is_active)
            .map((record) => record.sport_id)
        : sports[0]
          ? [sports[0].id]
          : [],
    );
    setError("");
  }, [court, courtSports, sports, visible]);

  async function submit() {
    const minutes = Number(duration);
    const amount = Number(price);
    if (
      name.trim().length < 2 ||
      type.trim().length < 2 ||
      !Number.isInteger(minutes) ||
      minutes < 15 ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !sportIds.length
    ) {
      setError("Enter a court name, type, valid duration, price and at least one sport.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        id: court?.id,
        venueId,
        name,
        type,
        duration: minutes,
        price: amount,
        sportIds,
      });
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save court.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      onClose={onClose}
      subtitle="Supported sports determine which availability rules and slots can be created."
      title={court ? "Edit court" : "Add a court"}
      visible={visible}
    >
      <Field autoCapitalize="words" label="Court name" onChangeText={setName} value={name} />
      <Field autoCapitalize="words" label="Court type" onChangeText={setType} value={type} />
      <View style={styles.twoColumns}>
        <View style={styles.flex}>
          <Field
            keyboardType="number-pad"
            label="Default minutes"
            onChangeText={setDuration}
            value={duration}
          />
        </View>
        <View style={styles.flex}>
          <Field
            keyboardType="decimal-pad"
            label="Base price (₹)"
            onChangeText={setPrice}
            value={price}
          />
        </View>
      </View>
      <Text style={textStyles.label}>Supported sports</Text>
      <MultiSports onChange={setSportIds} selected={sportIds} sports={sports} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button icon="content-save-outline" label="Save court" loading={busy} onPress={submit} />
    </Sheet>
  );
}

const weekdays = [
  { label: "Sun", value: "0" },
  { label: "Mon", value: "1" },
  { label: "Tue", value: "2" },
  { label: "Wed", value: "3" },
  { label: "Thu", value: "4" },
  { label: "Fri", value: "5" },
  { label: "Sat", value: "6" },
];

export function RuleEditorSheet({
  visible,
  courts,
  sports,
  courtSports,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  courts: Court[];
  sports: Sport[];
  courtSports: CourtSport[];
  onClose: () => void;
  onSubmit: (draft: RuleDraft) => Promise<void>;
}) {
  const [courtId, setCourtId] = useState("");
  const [sportId, setSportId] = useState("");
  const [weekday, setWeekday] = useState("1");
  const [opens, setOpens] = useState("06:00");
  const [closes, setCloses] = useState("22:00");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("1200");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const supportedSports = useMemo(() => {
    const ids = new Set(
      courtSports
        .filter((record) => record.court_id === courtId && record.is_active)
        .map((record) => record.sport_id),
    );
    return sports.filter((sport) => ids.has(sport.id));
  }, [courtId, courtSports, sports]);

  useEffect(() => {
    if (!visible) return;
    setCourtId(courts[0]?.id ?? "");
    setWeekday("1");
    setOpens("06:00");
    setCloses("22:00");
    setDuration(String(courts[0]?.default_duration_minutes ?? 60));
    setPrice(String(courts[0]?.base_price ?? 1200));
    setError("");
  }, [courts, visible]);

  useEffect(() => {
    setSportId(supportedSports[0]?.id ?? "");
  }, [supportedSports]);

  async function submit() {
    const minutes = Number(duration);
    const amount = Number(price);
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (
      !courtId ||
      !sportId ||
      !timePattern.test(opens) ||
      !timePattern.test(closes) ||
      opens >= closes ||
      !Number.isInteger(minutes) ||
      minutes < 15 ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setError("Choose a court and sport, then enter valid 24-hour times, duration and price.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        courtId,
        sportId,
        weekday: Number(weekday),
        opens,
        closes,
        duration: minutes,
        price: amount,
      });
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save rule.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      onClose={onClose}
      subtitle="Pllayz generates bookable slots from active weekly rules."
      title="Add availability"
      visible={visible}
    >
      <Text style={textStyles.label}>Court</Text>
      <ChoiceRow
        onSelect={(value) => {
          setCourtId(value);
          const court = courts.find((item) => item.id === value);
          setDuration(String(court?.default_duration_minutes ?? 60));
          setPrice(String(court?.base_price ?? 1200));
        }}
        options={courts.map((court) => ({ label: court.name, value: court.id }))}
        selected={courtId}
      />
      <Text style={textStyles.label}>Sport</Text>
      <ChoiceRow
        onSelect={setSportId}
        options={supportedSports.map((sport) => ({ label: sport.name, value: sport.id }))}
        selected={sportId}
      />
      <Text style={textStyles.label}>Day</Text>
      <ChoiceRow onSelect={setWeekday} options={weekdays} selected={weekday} />
      <View style={styles.twoColumns}>
        <View style={styles.flex}>
          <Field
            helper="24-hour format"
            label="Opens"
            maxLength={5}
            onChangeText={setOpens}
            placeholder="06:00"
            value={opens}
          />
        </View>
        <View style={styles.flex}>
          <Field
            helper="24-hour format"
            label="Closes"
            maxLength={5}
            onChangeText={setCloses}
            placeholder="22:00"
            value={closes}
          />
        </View>
      </View>
      <View style={styles.twoColumns}>
        <View style={styles.flex}>
          <Field
            keyboardType="number-pad"
            label="Slot minutes"
            onChangeText={setDuration}
            value={duration}
          />
        </View>
        <View style={styles.flex}>
          <Field
            keyboardType="decimal-pad"
            label="Slot price (₹)"
            onChangeText={setPrice}
            value={price}
          />
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button icon="calendar-plus" label="Add weekly rule" loading={busy} onPress={submit} />
    </Sheet>
  );
}

const styles=StyleSheet.create({
  twoColumns:{flexDirection:"row",gap:spacing.sm},
  flex:{flex:1},
  wrap:{flexDirection:"row",flexWrap:"wrap",gap:8},
  multiChoice:{alignItems:"center",backgroundColor:colors.surface,borderColor:colors.border,borderRadius:radius.pill,borderWidth:1,flexDirection:"row",gap:6,minHeight:40,paddingHorizontal:13},
  multiChoiceActive:{backgroundColor:colors.black,borderColor:colors.black},
  multiText:{color:colors.muted,fontSize:12,fontWeight:"800"},
  multiTextActive:{color:colors.white},
  pressed:{opacity:.76},
  error:{color:colors.red,fontSize:13,lineHeight:19},
});
