import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { BrandMark, Button, Card, ChoiceRow, Screen, textStyles } from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { errorMessage } from "@/lib/format";
import { colors, spacing } from "@/lib/theme";
import type { AccountType } from "@/lib/types";

export default function RoleScreen() {
  const { chooseRole, profile, user } = useAuth();
  const [role, setRole] = useState<AccountType>("player");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <Redirect href="/login" />;
  if (profile) return <Redirect href="/" />;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await chooseRole(role);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <BrandMark />
        <Text style={styles.title}>How will you use Pllayz?</Text>
        <Text style={textStyles.body}>
          Your account type controls the workspace you see and cannot be changed later.
        </Text>
        <ChoiceRow
          onSelect={(value) => setRole(value as AccountType)}
          options={[
            { label: "Player", value: "player", icon: "badminton" },
            { label: "Venue owner", value: "owner", icon: "stadium-outline" },
          ]}
          selected={role}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Continue" loading={busy} onPress={submit} />
      </Card>
    </Screen>
  );
}

const styles=StyleSheet.create({
  card:{alignSelf:"center",gap:spacing.lg,marginTop:80,maxWidth:520,padding:spacing.xl,width:"100%"},
  title:{color:colors.ink,fontSize:29,fontWeight:"900",letterSpacing:-0.8},
  error:{color:colors.red,fontSize:13},
});
