import { BookingStatusBadge } from "@/components/marketplace/booking-status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { bookingStatuses } from "@/lib/mock-data";

export default function PlayerBookingsPage() {
  return (
    <PageShell
      eyebrow="Player · Bookings"
      title="Booking status system"
      description="These reusable states are visual contracts only; booking mutations are intentionally excluded from Module 1."
    >
      <Card className="divide-y divide-border">
        {bookingStatuses.map((status) => (
          <div key={status} className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm capitalize text-muted-foreground">
              {status.replaceAll("_", " ")}
            </p>
            <BookingStatusBadge status={status} />
          </div>
        ))}
      </Card>
    </PageShell>
  );
}
