import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  AnimatedEntry,
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
import { appConfig } from "@/lib/config";
import { colors, radius, spacing } from "@/lib/theme";
import type { AccountType } from "@/lib/types";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function LoginScreen() {
  const {
    authError,
    clearAuthError,
    configured,
    loading,
    profile,
    sendMagicLink,
    user,
  } = useAuth();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AccountType>("player");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => clearAuthError, [clearAuthError]);

  if (!loading && user && profile) return <Redirect href="/" />;

  async function submit() {
    if (!emailPattern.test(email.trim())) {
      setLocalError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setLocalError("");
    try {
      await sendMagicLink(email, role);
      setSent(true);
    } catch (error) {
      setLocalError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.layout, width >= 820 && styles.layoutWide]}
      >
        <AnimatedEntry style={styles.heroWrap}>
          <LinearGradient
            colors={["#07110D", "#123C2B", "#00A86B"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.hero}
          >
            <Image
              contentFit="cover"
              source={require("../../assets/images/night-match-hero.png")}
              style={styles.heroImage}
            />
            <View style={styles.heroShade} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons color={colors.lime} name="lightning-bolt" size={16} />
                <Text style={styles.heroBadgeText}>TRICITY SPORTS, SIMPLIFIED</Text>
              </View>
              <Text style={styles.heroTitle}>Your next game starts here.</Text>
              <Text style={styles.heroText}>
                Book trusted venues, find an opponent team, and track every payment
                from one clean mobile workspace.
              </Text>
              <View style={styles.trustRow}>
                <Text style={styles.trustText}>20 venues</Text>
                <View style={styles.dot} />
                <Text style={styles.trustText}>₹500 secure advance</Text>
                <View style={styles.dot} />
                <Text style={styles.trustText}>Live slots</Text>
              </View>
            </View>
          </LinearGradient>
        </AnimatedEntry>

        <AnimatedEntry delay={110} style={styles.formWrap}>
          <Card style={styles.formCard}>
            <BrandMark />
            <View style={styles.formHeading}>
              <Text style={styles.formTitle}>
                {sent ? "Check your inbox" : "Welcome to Pllayz"}
              </Text>
              <Text style={textStyles.body}>
                {sent
                  ? "Open only the newest sign-in email on this phone. It returns directly to Pllayz."
                  : "Choose how you use Pllayz, then sign in with a secure email link."}
              </Text>
            </View>

            {!configured ? (
              <Card tone="amber">
                <Text style={textStyles.label}>Build configuration missing</Text>
                <Text style={[textStyles.body, styles.topGap]}>
                  Add the four EXPO_PUBLIC values shown in .env.example before
                  starting or building the app.
                </Text>
              </Card>
            ) : sent ? (
              <>
                <View style={styles.sentIcon}>
                  <MaterialCommunityIcons
                    color={colors.greenDark}
                    name="email-fast-outline"
                    size={32}
                  />
                </View>
                <Text style={styles.emailText}>{email.trim().toLowerCase()}</Text>
                <Button
                  icon="refresh"
                  label="Use another email"
                  onPress={() => {
                    setSent(false);
                    setLocalError("");
                  }}
                  variant="secondary"
                />
                <Text style={styles.securityNote}>
                  Each link is single-use. If you requested more than one, open only
                  the latest email.
                </Text>
              </>
            ) : (
              <>
                <ChoiceRow
                  onSelect={(value) => setRole(value as AccountType)}
                  options={[
                    { label: "Player", value: "player", icon: "badminton" },
                    { label: "Venue owner", value: "owner", icon: "stadium-outline" },
                  ]}
                  selected={role}
                />
                <Field
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  label="Email address"
                  onChangeText={setEmail}
                  onSubmitEditing={submit}
                  placeholder="you@example.com"
                  returnKeyType="go"
                  value={email}
                />
                {localError || authError ? (
                  <Text style={styles.error}>{localError || authError}</Text>
                ) : null}
                <Button
                  disabled={!configured}
                  icon="arrow-right"
                  label="Email me a sign-in link"
                  loading={busy}
                  onPress={submit}
                />
              </>
            )}

            <Text onPress={() => void WebBrowser.openBrowserAsync(`${appConfig.webUrl}/privacy`)} style={styles.legal}>
              By continuing, you agree to the Pllayz privacy and fair-play policy.
            </Text>
          </Card>
        </AnimatedEntry>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles=StyleSheet.create({
  layout:{gap:spacing.md,justifyContent:"center",minHeight:700},
  layoutWide:{alignItems:"stretch",flexDirection:"row"},
  heroWrap:{flex:1,minHeight:410},
  hero:{borderRadius:radius.xl,flex:1,minHeight:410,overflow:"hidden"},
  heroImage:{height:"100%",opacity:0.64,position:"absolute",width:"100%"},
  heroShade:{backgroundColor:"rgba(4,13,9,0.34)",height:"100%",position:"absolute",width:"100%"},
  heroContent:{flex:1,justifyContent:"flex-end",padding:spacing.xl},
  heroBadge:{alignItems:"center",alignSelf:"flex-start",backgroundColor:"rgba(0,0,0,0.42)",borderColor:"rgba(255,255,255,0.18)",borderRadius:radius.pill,borderWidth:1,flexDirection:"row",gap:6,marginBottom:spacing.md,paddingHorizontal:11,paddingVertical:7},
  heroBadgeText:{color:colors.white,fontSize:10,fontWeight:"900",letterSpacing:0.8},
  heroTitle:{color:colors.white,fontSize:38,fontWeight:"900",letterSpacing:-1.4,lineHeight:42,maxWidth:460},
  heroText:{color:"#E1EFE8",fontSize:14,lineHeight:21,marginTop:12,maxWidth:460},
  trustRow:{alignItems:"center",flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:spacing.lg},
  trustText:{color:colors.white,fontSize:11,fontWeight:"700"},
  dot:{backgroundColor:colors.lime,borderRadius:3,height:5,width:5},
  formWrap:{flex:1,justifyContent:"center",minHeight:410},
  formCard:{gap:spacing.lg,padding:spacing.lg},
  formHeading:{gap:7},
  formTitle:{color:colors.ink,fontSize:25,fontWeight:"900",letterSpacing:-0.7},
  topGap:{marginTop:6},
  sentIcon:{alignItems:"center",alignSelf:"center",backgroundColor:colors.mint,borderRadius:radius.lg,height:70,justifyContent:"center",width:70},
  emailText:{color:colors.ink,fontSize:15,fontWeight:"800",textAlign:"center"},
  securityNote:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"center"},
  error:{color:colors.red,fontSize:13,lineHeight:19},
  legal:{color:colors.muted,fontSize:11,lineHeight:17,textAlign:"center",textDecorationLine:"underline"},
});
