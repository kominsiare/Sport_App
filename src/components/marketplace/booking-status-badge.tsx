import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/mock-data";

const labels: Record<BookingStatus, string> = {
  requested: "Requested",
  owner_accepted: "Owner accepted",
  owner_rejected: "Owner rejected",
  expired: "Expired",
  payment_pending: "Payment pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
};

const variants: Record<BookingStatus, BadgeProps["variant"]> = {
  requested: "default",
  owner_accepted: "accent",
  owner_rejected: "danger",
  expired: "neutral",
  payment_pending: "warning",
  confirmed: "success",
  cancelled: "neutral",
  completed: "success",
  disputed: "danger",
  refunded: "default",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
