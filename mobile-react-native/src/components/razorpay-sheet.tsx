import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { formatMoney } from "@/lib/format";
import { colors, radius, spacing } from "@/lib/theme";
import type {
  BookingHold,
  PaymentOrder,
  RazorpayReturn,
} from "@/lib/types";

type CheckoutMessage =
  | { type: "success"; response: RazorpayReturn }
  | { type: "dismissed" }
  | { type: "error"; message?: string };

function checkoutHtml(order: PaymentOrder, hold: BookingHold) {
  const data = JSON.stringify({
    key: order.key_id,
    amount: order.order.amount,
    currency: order.order.currency,
    name: "Pllayz",
    description: `₹500 advance · ${hold.snapshot_venue_name}`,
    order_id: order.order.id,
    retry: { enabled: true },
    theme: { color: "#00A86B", backdrop_color: "#101814" },
  }).replace(/</g, "\\u003c");

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
  <style>
    html,body{margin:0;height:100%;background:#f5f7f6;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
    .loading{height:100%;display:grid;place-items:center;color:#66736e;font-size:14px}
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="loading">Opening secure Razorpay Checkout…</div>
  <script>
    const send = (message) => window.ReactNativeWebView.postMessage(JSON.stringify(message));
    const base = ${data};
    const launch = () => {
      if (!window.Razorpay) {
        send({type:"error",message:"Razorpay Checkout could not be loaded."});
        return;
      }
      const checkout = new window.Razorpay({
        ...base,
        handler: (response) => send({type:"success",response}),
        modal: {ondismiss: () => send({type:"dismissed"})}
      });
      checkout.on("payment.failed", (response) => {
        send({type:"error",message:response?.error?.description || "Payment failed."});
      });
      checkout.open();
    };
    if (document.readyState === "complete") launch();
    else window.addEventListener("load", launch);
  </script>
</body>
</html>`;
}

export function RazorpaySheet({
  checkout,
  hold,
  onClose,
  onSuccess,
}: {
  checkout: PaymentOrder | null;
  hold: BookingHold | null;
  onClose: () => void;
  onSuccess: (response: RazorpayReturn) => Promise<void>;
}) {
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const html = useMemo(
    () => (checkout && hold ? checkoutHtml(checkout, hold) : ""),
    [checkout, hold],
  );

  async function handleMessage(event: WebViewMessageEvent) {
    let payload: CheckoutMessage;
    try {
      payload = JSON.parse(event.nativeEvent.data) as CheckoutMessage;
    } catch {
      setMessage("Checkout returned an unreadable response.");
      return;
    }
    if (payload.type === "dismissed") {
      setMessage("Checkout closed. Your order is saved; continue it without creating a duplicate.");
      return;
    }
    if (payload.type === "error") {
      setMessage(payload.message || "Unable to complete payment.");
      return;
    }
    setVerifying(true);
    setMessage("Payment received. Waiting for secure verification…");
    try {
      await onSuccess(payload.response);
      setMessage("Payment verified. Booking confirmation will sync automatically.");
    } catch {
      setMessage("Razorpay accepted the payment, but confirmation is still syncing. Do not pay again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={Boolean(checkout && hold)}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.copy}>
            <Text style={styles.title}>Secure payment</Text>
            <Text style={styles.subtitle}>
              {hold
                ? `${formatMoney(hold.snapshot_advance_amount)} advance · ${hold.snapshot_venue_name}`
                : ""}
            </Text>
          </View>
          <Pressable accessibilityLabel="Close checkout" onPress={onClose} style={styles.close}>
            <MaterialCommunityIcons color={colors.ink} name="close" size={22} />
          </Pressable>
        </View>
        {message ? (
          <View style={styles.message}>
            {verifying ? <ActivityIndicator color={colors.green} size="small" /> : null}
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}
        {html ? (
          <WebView
            domStorageEnabled
            javaScriptEnabled
            mixedContentMode="never"
            onMessage={handleMessage}
            originWhitelist={["https://*", "http://localhost"]}
            setSupportMultipleWindows={false}
            source={{ html, baseUrl: "https://pllayz-app.onrender.com" }}
            startInLoadingState
            style={styles.webview}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles=StyleSheet.create({
  safe:{backgroundColor:colors.canvas,flex:1},
  header:{alignItems:"center",backgroundColor:colors.surface,borderBottomColor:colors.border,borderBottomWidth:1,flexDirection:"row",gap:spacing.md,padding:spacing.md},
  copy:{flex:1},
  title:{color:colors.ink,fontSize:19,fontWeight:"900"},
  subtitle:{color:colors.muted,fontSize:12,marginTop:3},
  close:{alignItems:"center",backgroundColor:colors.surfaceSoft,borderRadius:radius.pill,height:42,justifyContent:"center",width:42},
  message:{alignItems:"center",backgroundColor:colors.amberSoft,flexDirection:"row",gap:10,paddingHorizontal:spacing.md,paddingVertical:12},
  messageText:{color:colors.ink,flex:1,fontSize:12,lineHeight:18},
  webview:{backgroundColor:colors.canvas,flex:1},
});
