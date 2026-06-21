import { Badge } from "@/components/ui/badge";
import type {
  VenueApprovalDecision,
  VenueStatus,
} from "@/types/database";

export function OwnerStatusBadge({
  status,
  decision,
}: {
  status: VenueStatus;
  decision?: VenueApprovalDecision | null;
}) {
  if (status === "active" && decision === "approved") {
    return <Badge variant="success">Live · approved</Badge>;
  }

  if (status === "suspended") {
    return <Badge variant="danger">Suspended</Badge>;
  }

  if (decision === "rejected") {
    return <Badge variant="danger">Changes requested</Badge>;
  }

  if (status === "pending_review" || decision === "pending") {
    return <Badge variant="warning">Pending review</Badge>;
  }

  return <Badge variant="neutral">Draft</Badge>;
}
