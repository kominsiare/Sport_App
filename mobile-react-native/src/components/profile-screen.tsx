import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  ChoiceRow,
  DetailRow,
  Field,
  IconButton,
  Screen,
  Sheet,
  StatusPill,
  textStyles,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { errorMessage, initials } from "@/lib/format";
import { appConfig } from "@/lib/config";
import { colors, radius, spacing } from "@/lib/theme";

export function ProfileScreen() {
  const { profile, saveProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [businessName, setBusinessName] = useState(profile?.business_name ?? "");
  const [city, setCity] = useState(profile?.city ?? "Chandigarh");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    setFullName(profile?.full_name ?? "");
    setBusinessName(profile?.business_name ?? "");
    setCity(profile?.city ?? "Chandigarh");
    setError("");
  }, [editing, profile]);

  if (!profile) return null;
  const owner = profile.account_type === "owner";

  async function save() {
    if (fullName.trim().length < 2 || (owner && businessName.trim().length < 2)) {
      setError("Complete all required profile details.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveProfile({
        fullName,
        city,
        businessName: owner ? businessName : null,
      });
      setEditing(false);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Screen
        action={<IconButton icon="pencil-outline" label="Edit profile" onPress={() => setEditing(true)} tone="green" />}
        eyebrow={owner ? "VENUE OWNER" : "PLAYER"}
        subtitle="Your identity, verification and support settings."
        title="Profile"
      >
        <Card style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(profile.full_name)}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{profile.full_name || "Pllayz member"}</Text>
            <Text style={textStyles.body}>{profile.email || profile.phone || "Signed in"}</Text>
            <StatusPill tone="success" value={owner ? "Venue owner" : "Player"} />
          </View>
        </Card>

        <Card style={styles.stack}>
          <DetailRow icon="map-marker-outline" label="City" value={profile.city || "Not set"} />
          <View style={styles.divider} />
          <DetailRow
            icon="email-check-outline"
            label="Email verification"
            value={profile.email_verified_at ? "Verified" : "Pending"}
          />
          <View style={styles.divider} />
          <DetailRow
            icon="cellphone-check"
            label="Mobile verification"
            value={profile.phone_verified_at ? "Verified" : "Optional"}
          />
          {owner ? (
            <>
              <View style={styles.divider} />
              <DetailRow
                icon="briefcase-outline"
                label="Business"
                value={profile.business_name || "Not set"}
              />
            </>
          ) : null}
        </Card>

        <Card style={styles.stack}>
          <Text style={textStyles.title}>Account & support</Text>
          <Button
            icon="shield-lock-outline"
            label="Privacy and support"
            onPress={() => void WebBrowser.openBrowserAsync(`${appConfig.webUrl}/privacy`)}
            variant="ghost"
          />
          <Button
            icon="logout"
            label="Sign out"
            onPress={() =>
              Alert.alert("Sign out?", "You can return with a fresh email link.", [
                { text: "Stay signed in", style: "cancel" },
                {
                  text: "Sign out",
                  style: "destructive",
                  onPress: () => void signOut(),
                },
              ])
            }
            variant="danger"
          />
        </Card>

        <View style={styles.version}>
          <MaterialCommunityIcons color={colors.green} name="shield-check" size={16} />
          <Text style={styles.versionText}>Pllayz Mobile 1.0 · Secure Supabase session</Text>
        </View>
      </Screen>

      <Sheet
        onClose={() => setEditing(false)}
        subtitle="These details appear in bookings and owner operations."
        title="Edit profile"
        visible={editing}
      >
        <Field
          autoCapitalize="words"
          label="Full name"
          onChangeText={setFullName}
          value={fullName}
        />
        {owner ? (
          <Field
            autoCapitalize="words"
            label="Business name"
            onChangeText={setBusinessName}
            value={businessName}
          />
        ) : null}
        <Text style={textStyles.label}>City</Text>
        <ChoiceRow
          onSelect={(value) => setCity(value as typeof city)}
          options={["Chandigarh", "Mohali", "Panchkula"].map((value) => ({
            label: value,
            value,
          }))}
          selected={city}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button icon="content-save-outline" label="Save profile" loading={busy} onPress={save} />
      </Sheet>
    </>
  );
}

const styles=StyleSheet.create({
  identity:{alignItems:"center",flexDirection:"row",gap:spacing.md,padding:spacing.lg},
  avatar:{alignItems:"center",backgroundColor:colors.mint,borderRadius:radius.lg,height:68,justifyContent:"center",width:68},
  avatarText:{color:colors.greenDark,fontSize:23,fontWeight:"900"},
  identityCopy:{alignItems:"flex-start",flex:1,gap:5},
  name:{color:colors.ink,fontSize:21,fontWeight:"900",letterSpacing:-0.4},
  stack:{gap:spacing.md},
  divider:{backgroundColor:colors.border,height:1},
  version:{alignItems:"center",alignSelf:"center",flexDirection:"row",gap:7,padding:spacing.md},
  versionText:{color:colors.muted,fontSize:11},
  error:{color:colors.red,fontSize:13},
});
