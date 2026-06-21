import { PageShell } from "@/components/layout/page-shell";
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
  const { logs } = await getOwnerDashboardData();

  return (
    <PageShell
      eyebrow="Owner · Activity"
      title="Operations and booking activity"
      description="Owner changes are live and audited. Booking and verified-payment events will join this feed in later modules."
    >
      <Card className="p-5">
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
        <Badge variant="warning">Booking module pending</Badge>
        <h2 className="mt-4 font-semibold">No booking decisions here yet</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The approved payment-at-booking flow does not require owner acceptance
          before payment. Confirmed bookings, payment holds and operational alerts
          will appear after those modules are approved.
        </p>
      </Card>
    </PageShell>
  );
}
