import { BookingHoldList } from "@/components/bookings/booking-hold-list";
import { PageShell } from "@/components/layout/page-shell";
import { getPlayerBookingData } from "@/lib/bookings/server";

export default async function PlayerBookingsPage() {
  const { holds, payments, bookings, matchmakingPosts } =
    await getPlayerBookingData();

  return (
    <PageShell
      eyebrow="Bookings"
      title="Track every booking"
      description="See holds, payment progress, webhook-verified bookings, and opponent-search options in one clear timeline."
    >
      <BookingHoldList
        holds={holds}
        payments={payments}
        bookings={bookings}
        matchmakingPosts={matchmakingPosts}
      />
    </PageShell>
  );
}
