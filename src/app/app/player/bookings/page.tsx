import { BookingHoldList } from "@/components/bookings/booking-hold-list";
import { PageShell } from "@/components/layout/page-shell";
import { getPlayerBookingData } from "@/lib/bookings/server";

export default async function PlayerBookingsPage() {
  const { holds, payments, bookings } = await getPlayerBookingData();

  return (
    <PageShell
      eyebrow="Player · Bookings"
      title="Bookings and payments"
      description="Pay the fixed ₹500 advance securely. A booking becomes confirmed only after Razorpay sends a verified captured-payment webhook."
    >
      <BookingHoldList
        holds={holds}
        payments={payments}
        bookings={bookings}
      />
    </PageShell>
  );
}
