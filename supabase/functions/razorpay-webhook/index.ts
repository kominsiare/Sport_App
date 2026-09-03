import "@supabase/functions-js/edge-runtime.d.ts";

import {
  hmacSha256Hex,
  jsonResponse,
  requiredEnv,
  sha256Hex,
  timingSafeHexEqual,
} from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase.ts";

type RazorpayPaymentEntity = {
  amount?: number;
  currency?: string;
  id?: string;
  order_id?: string;
  status?: string;
};

type RazorpayWebhook = {
  event?: string;
  payload?: {
    order?: {
      entity?: {
        id?: string;
        status?: string;
      };
    };
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
};

const supportedEvents = new Set([
  "payment.captured",
  "payment.failed",
  "order.paid",
]);

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const signature = request.headers.get("x-razorpay-signature");
    const eventId = request.headers.get("x-razorpay-event-id");
    const rawBody = await request.text();

    if (!signature || !eventId) {
      return jsonResponse({ error: "missing_webhook_headers" }, 400);
    }

    const expectedSignature = await hmacSha256Hex(
      requiredEnv("RAZORPAY_WEBHOOK_SECRET"),
      rawBody,
    );

    if (!timingSafeHexEqual(expectedSignature, signature)) {
      return jsonResponse({ error: "invalid_webhook_signature" }, 401);
    }

    const event = JSON.parse(rawBody) as RazorpayWebhook;
    const eventType = event.event;

    if (!eventType || !supportedEvents.has(eventType)) {
      return jsonResponse({ received: true, ignored: true }, 200);
    }

    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;
    const paymentId = payment?.id;
    const amount = payment?.amount;
    const currency = payment?.currency;
    const paymentStatus =
      payment?.status ??
      (eventType === "order.paid" ? "captured" : undefined);

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof amount !== "number" ||
      typeof currency !== "string" ||
      typeof paymentStatus !== "string"
    ) {
      console.error("Razorpay webhook payload is incomplete", {
        eventId,
        eventType,
      });
      return jsonResponse({ error: "invalid_webhook_payload" }, 422);
    }

    const service = createServiceClient();
    const { data, error } = await service.rpc("process_razorpay_webhook", {
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload_sha256: await sha256Hex(rawBody),
      p_payload: event,
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_amount_subunits: amount,
      p_currency: currency,
      p_gateway_payment_status: paymentStatus,
    });

    if (error) {
      console.error("Razorpay webhook processing failed", {
        eventId,
        eventType,
        error: error.message,
      });
      return jsonResponse({ error: "webhook_processing_failed" }, 500);
    }

    return jsonResponse({ received: true, result: data }, 200);
  } catch (error) {
    console.error("razorpay-webhook failed", error);
    return jsonResponse({ error: "invalid_webhook_request" }, 400);
  }
});
