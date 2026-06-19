import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/states/empty-state";

export default function OwnerRequestsPage() {
  return (
    <PageShell
      eyebrow="Owner · Activity"
      title="Booking activity"
      description="The latest confirmed flow does not use owner acceptance before payment, so this route remains an operational activity placeholder rather than an accept/reject inbox."
    >
      <EmptyState
        title="No live activity yet"
        description="Verified payment holds, confirmed bookings and operational alerts will appear here after the booking and payment modules are approved."
      />
    </PageShell>
  );
}
