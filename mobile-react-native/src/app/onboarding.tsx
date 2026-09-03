import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BrandMark,
  Button,
  Card,
  ChoiceRow,
  Field,
  Screen,
  textStyles,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { errorMessage } from "@/lib/format";
import { colors, spacing } from "@/lib/theme";

export default function OnboardingScreen() {
  const { profile, saveProfile, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [businessName, setBusinessName] = useState(profile?.business_name ?? "");
  const [city, setCity] = useState(profile?.city ?? "Chandigarh");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setBusinessName(profile?.business_name ?? "");
    setCity(profile?.city ?? "Chandigarh");
  }, [profile]);

  if (!user) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/role" />;
  if (profile.profile_complete) return <Redirect href="/" />;

  const owner = profile.account_type === "owner";

  async function submit() {
    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (owner && businessName.trim().length < 2) {
      setError("Enter your business name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveProfile({
        fullName,
        businessName: owner ? businessName : null,
        city,
      });
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.layout}>
        <View style={styles.intro}>
          <BrandMark />
          <Text style={styles.step}>ONE QUICK STEP</Text>
          <Text style={styles.title}>
            {owner ? "Set up your venue workspace." : "Build your player profile."}
          </Text>
          <Text style={textStyles.body}>
            We use this information for bookings, team matchmaking, and local venue
            discovery. You can edit it later.
          </Text>
        </View>
        <Card style={styles.form}>
          <Field
            autoCapitalize="words"
            label="Full name"
            onChangeText={setFullName}
            placeholder="Your name"
            value={fullName}
          />
          {owner ? (
            <Field
              autoCapitalize="words"
              label="Business name"
              onChangeText={setBusinessName}
              placeholder="Your venue business"
              value={businessName}
            />
          ) : null}
          <Text style={textStyles.label}>Home city</Text>
          <ChoiceRow
            onSelect={(value) => setCity(value as typeof city)}
            options={["Chandigarh", "Mohali", "Panchkula"].map((value) => ({
              label: value,
              value,
            }))}
            selected={city}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            icon="check"
            label={owner ? "Open owner workspace" : "Start playing"}
            loading={busy}
            onPress={submit}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles=StyleSheet.create({
  layout:{alignSelf:"center",gap:spacing.xl,justifyContent:"center",maxWidth:760,minHeight:680,width:"100%"},
  intro:{gap:spacing.md},
  step:{color:colors.greenDark,fontSize:11,fontWeight:"900",letterSpacing:1.4,marginTop:spacing.md},
  title:{color:colors.ink,fontSize:34,fontWeight:"900",letterSpacing:-1.1,lineHeight:39},
  form:{gap:spacing.md,padding:spacing.lg},
  error:{color:colors.red,fontSize:13},
});
