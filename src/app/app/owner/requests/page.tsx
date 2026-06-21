import { PageShell } from "@/components/layout/page-shell";
import { BookingStatusBadge } from "@/components/marketplace/booking-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOwnerDashboardData } from "@/lib/owner/server";

const activityDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default async function OwnerRequestsPage() {
  const { logs, bookingHolds } = await getOwnerDashboardData();

  return (
    <PageShell
      eyebrow="Owner · Activity"
      title="Operations and booking activity"
      description="Owner changes are live and audited. Booking and verified-payment events will join this feed in later modules."
    >
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Player payment holds</h2>
          <Badge variant="neutral">Read-only</Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Owners can see operational court demand, but cannot accept, reject, or
          inspect Player contact details.
        </p>
        {bookingHolds.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {bookingHolds.map((hold) => (
              <div
                key={hold.id}
                className="rounded-xl border border-border bg-secondary/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BookingStatusBadge status={hold.status} />
                      <Badge variant="neutral">
                        {hold.snapshot_sport_name}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold">
                      {hold.snapshot_venue_name} · {hold.snapshot_court_name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activityDate.format(
                        new Date(hold.snapshot_start_time),
                      )}{" "}
                      · {hold.snapshot_duration_minutes} min
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-accent">
                    ₹{hold.snapshot_total_amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No Player payment holds have reached your venues yet.
          </p>
        )}
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Operations audit</h2>
          <Badge variant="neutral">Append-only</Badge>
        </div>
        {logs.length > 0 ? (
          <div className="mt-4 grid gap-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm font-semibold">
                  {log.action.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activityDate.format(new Date(log.created_at))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            No owner operations have been recorded yet.
          </p>
        )}
      </Card>

      <Card className="mt-5 p-5">
        <Badge variant="warning">Payment module pending</Badge>
        <h2 className="mt-4 font-semibold">No booking decisions here yet</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The approved payment-at-booking flow does not require owner acceptance
          before payment. Confirmed bookings and verified-payment alerts will appear
          after Razorpay integration is approved.
        </p>
      </Card>
    </PageShell>
  );
}
