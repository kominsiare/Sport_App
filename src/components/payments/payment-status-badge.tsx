import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { PaymentStatus } from "@/types/database";

const labels: Record<PaymentStatus, string> = {
  order_creating: "Preparing payment",
  order_created: "Ready to pay",
  payment_processing: "Verifying payment",
  captured: "Paid",
  captured_review: "Payment under review",
  failed: "Payment failed",
  expired: "Payment expired",
  refunded: "Refunded",
};

const variants: Record<PaymentStatus, BadgeProps["variant"]> = {
  order_creating: "warning",
  order_created: "default",
  payment_processing: "warning",
  captured: "success",
  captured_review: "danger",
  failed: "danger",
  expired: "neutral",
  refunded: "neutral",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
