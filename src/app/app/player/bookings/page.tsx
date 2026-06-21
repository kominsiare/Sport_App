import { BookingHoldList } from "@/components/bookings/booking-hold-list";
import { PageShell } from "@/components/layout/page-shell";
import { getPlayerBookingData } from "@/lib/bookings/server";

export default async function PlayerBookingsPage() {
  const { holds } = await getPlayerBookingData();

  return (
    <PageShell
      eyebrow="Player · Bookings"
      title="Your payment holds"
      description="A live hold reserves one physical court across its supported sports for ten minutes. Payment and confirmation arrive in Module 6."
    >
      <BookingHoldList holds={holds} />
    </PageShell>
  );
}
