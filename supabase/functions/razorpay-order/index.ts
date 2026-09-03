import "@supabase/functions-js/edge-runtime.d.ts";

import {
  corsHeaders,
  errorResponse,
  jsonResponse,
  razorpayRequest,
  requiredEnv,
} from "../_shared/http.ts";
import {
  createServiceClient,
  requireUser,
} from "../_shared/supabase.ts";

type OrderClaim = {
  amount_subunits: number;
  currency: string;
  expires_at: string;
  hold_id: string;
  payment_id: string;
  razorpay_order_id: string | null;
  receipt: string;
  should_create: boolean;
  sport_name: string;
  venue_name: string;
};

type RazorpayOrder = {
  amount: number;
  amount_due: number;
  amount_paid: number;
  attempts: number;
  created_at: number;
  currency: string;
  entity: "order";
  id: string;
  notes: Record<string, string>;
  offer_id: string | null;
  receipt: string;
  status: "created" | "attempted" | "paid";
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
    const holdId =
      body && typeof body === "object" && "hold_id" in body
        ? body.hold_id
        : null;

    if (typeof holdId !== "string" || holdId.length < 30) {
      return errorResponse("A valid booking hold is required.", 422, "invalid_hold");
    }

    const claimToken = crypto.randomUUID();
    const { data, error } = await client.rpc("claim_my_razorpay_order", {
      p_hold_id: holdId,
      p_claim_token: claimToken,
    });

    if (error) {
      const status = error.message.includes("not_payable") ? 409 : 400;
      return errorResponse(error.message, status, "order_claim_failed");
    }

    const claim = data as OrderClaim;
    const keyId = requiredEnv("RAZORPAY_KEY_ID");

    if (claim.razorpay_order_id) {
      return jsonResponse(
        {
          key_id: keyId,
          payment_id: claim.payment_id,
          expires_at: claim.expires_at,
          order: {
            id: claim.razorpay_order_id,
            amount: claim.amount_subunits,
            currency: claim.currency,
            receipt: claim.receipt,
          },
        },
        200,
        corsHeaders,
      );
    }

    if (!claim.should_create) {
      return errorResponse(
        "Your payment order is already being prepared. Try again in a moment.",
        409,
        "order_preparing",
      );
    }

    let order: RazorpayOrder;
    try {
      order = await razorpayRequest<RazorpayOrder>("/orders", {
        method: "POST",
        body: JSON.stringify({
          amount: claim.amount_subunits,
          currency: claim.currency,
          receipt: claim.receipt,
          notes: {
            booking_hold_id: claim.hold_id,
            payment_id: claim.payment_id,
            venue: claim.venue_name,
            sport: claim.sport_name,
          },
        }),
      });
    } catch (error) {
      const service = createServiceClient();
      await service.rpc("release_razorpay_order_claim", {
        p_payment_id: claim.payment_id,
        p_claim_token: claimToken,
        p_failure_code: "razorpay_order_failed",
        p_failure_description:
          error instanceof Error ? error.message : "Unable to create order",
      });
      throw error;
    }

    const service = createServiceClient();
    const { error: registrationError } = await service.rpc(
      "register_razorpay_order",
      {
        p_payment_id: claim.payment_id,
        p_claim_token: claimToken,
        p_order_id: order.id,
        p_amount_subunits: order.amount,
        p_currency: order.currency,
        p_gateway_order_status: order.status,
        p_gateway_created_at: new Date(order.created_at * 1000).toISOString(),
      },
    );

    if (registrationError) {
      console.error("Unable to register Razorpay order", {
        paymentId: claim.payment_id,
        orderId: order.id,
        error: registrationError.message,
      });
      return errorResponse(
        "The gateway order was created but could not be attached. Support has been notified.",
        500,
        "order_registration_failed",
      );
    }

    return jsonResponse(
      {
        key_id: keyId,
        payment_id: claim.payment_id,
        expires_at: claim.expires_at,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
      },
      201,
      corsHeaders,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "authentication_required") {
      return errorResponse("Sign in again to continue.", 401, "unauthorized");
    }

    console.error("razorpay-order failed", error);
    return errorResponse(
      "Unable to start Razorpay checkout. Please try again.",
      502,
      "razorpay_unavailable",
    );
  }
});
