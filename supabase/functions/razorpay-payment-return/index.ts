import "@supabase/functions-js/edge-runtime.d.ts";

import {
  corsHeaders,
  errorResponse,
  hmacSha256Hex,
  jsonResponse,
  razorpayRequest,
  requiredEnv,
  timingSafeHexEqual,
} from "../_shared/http.ts";
import {
  createServiceClient,
  requireUser,
} from "../_shared/supabase.ts";

type RazorpayPayment = {
  amount: number;
  captured: boolean;
  currency: string;
  entity: "payment";
  error_code: string | null;
  error_description: string | null;
  id: string;
  order_id: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorResponse("Use POST for this endpoint.", 405, "method_not_allowed");
  }

  try {
    const { client } = await requireUser(request.headers.get("Authorization"));
    const body = await request.json().catch(() => null);
    const orderId =
      body && typeof body === "object" && "razorpay_order_id" in body
        ? body.razorpay_order_id
        : null;
    const paymentId =
      body && typeof body === "object" && "razorpay_payment_id" in body
        ? body.razorpay_payment_id
        : null;
    const signature =
      body && typeof body === "object" && "razorpay_signature" in body
        ? body.razorpay_signature
        : null;

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string"
    ) {
      return errorResponse(
        "The checkout response is incomplete.",
        422,
        "invalid_checkout_response",
      );
    }

    const { data: ownedPayment, error: paymentLookupError } = await client
      .from("payments")
      .select("id, razorpay_order_id")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (paymentLookupError || !ownedPayment) {
      return errorResponse(
        "This payment order does not belong to your account.",
        403,
        "payment_not_owned",
      );
    }

    const expectedSignature = await hmacSha256Hex(
      requiredEnv("RAZORPAY_KEY_SECRET"),
      `${ownedPayment.razorpay_order_id}|${paymentId}`,
    );

    if (!timingSafeHexEqual(expectedSignature, signature)) {
      return errorResponse(
        "The payment signature could not be verified.",
        401,
        "invalid_payment_signature",
      );
    }

    const payment = await razorpayRequest<RazorpayPayment>(
      `/payments/${encodeURIComponent(paymentId)}`,
    );

    if (
      payment.order_id !== ownedPayment.razorpay_order_id ||
      !["authorized", "captured"].includes(payment.status)
    ) {
      return errorResponse(
        "Razorpay has not accepted this payment yet.",
        409,
        "payment_not_authorized",
      );
    }

    const service = createServiceClient();
    const { data, error } = await service.rpc(
      "mark_razorpay_payment_processing",
      {
        p_order_id: payment.order_id,
        p_payment_id: payment.id,
        p_amount_subunits: payment.amount,
        p_currency: payment.currency,
        p_gateway_payment_status: payment.status,
      },
    );

    if (error) {
      console.error("Unable to mark payment processing", {
        orderId,
        paymentId,
        error: error.message,
      });
      return errorResponse(
        "Payment was accepted, but confirmation is still syncing.",
        500,
        "payment_sync_failed",
      );
    }

    return jsonResponse(
      {
        status: "payment_processing",
        gateway_status: payment.status,
        payment_id: data?.id ?? ownedPayment.id,
        message:
          "Payment received. Your booking will confirm after the secure Razorpay webhook arrives.",
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "authentication_required") {
      return errorResponse("Sign in again to continue.", 401, "unauthorized");
    }

    console.error("razorpay-payment-return failed", error);
    return errorResponse(
      "Payment verification is temporarily unavailable.",
      502,
      "verification_unavailable",
    );
  }
});
