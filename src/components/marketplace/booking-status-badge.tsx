import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { BookingHoldStatus } from "@/types/database";

const labels: Record<BookingHoldStatus, string> = {
  payment_pending: "Payment pending",
  cancelled: "Cancelled",
  expired: "Expired",
  converted: "Payment verified",
};

const variants: Record<BookingHoldStatus, BadgeProps["variant"]> = {
  payment_pending: "warning",
  cancelled: "neutral",
  expired: "neutral",
  converted: "success",
};

export function BookingStatusBadge({ status }: { status: BookingHoldStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
