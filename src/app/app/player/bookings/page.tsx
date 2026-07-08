import { BookingHoldList } from "@/components/bookings/booking-hold-list";
import { PageShell } from "@/components/layout/page-shell";
import { getPlayerBookingData } from "@/lib/bookings/server";

export default async function PlayerBookingsPage() {
  const { holds, payments, bookings, matchmakingPosts } =
    await getPlayerBookingData();

  return (
    <PageShell
      eyebrow="Player · Bookings"
      title="Bookings and payments"
      description="Pay the fixed ₹500 advance securely, then optionally publish a confirmed slot for teams looking for an opponent."
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
