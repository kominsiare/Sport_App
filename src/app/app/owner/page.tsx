import Link from "next/link";
import {
  HiArrowRight,
  HiBuildingOffice2,
  HiCalendarDays,
  HiClock,
  HiNoSymbol,
  HiShieldCheck,
} from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOwnerDashboardData } from "@/lib/owner/server";
import { cn } from "@/lib/utils";

const activityDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default async function OwnerHomePage() {
  const { metrics, logs } = await getOwnerDashboardData();
  const cards = [
    {
      label: "Owned venues",
      value: metrics.totalVenues,
      icon: HiBuildingOffice2,
    },
    {
      label: "Pending admin review",
      value: metrics.pendingReview,
      icon: HiShieldCheck,
    },
    {
      label: "Open 7-day slots",
      value: metrics.availableSlots,
      icon: HiCalendarDays,
    },
    {
      label: "Offline blocks",
      value: metrics.blockedSlots,
      icon: HiNoSymbol,
    },
    {
      label: "Active payment holds",
      value: metrics.activeBookingHolds,
      icon: HiClock,
    },
  ];

  return (
    <PageShell
      eyebrow="Venue owner"
      title="Your venue operations, in one place"
      description="Create private drafts, configure playable surfaces and weekly availability, then submit complete venues for admin review."
      actions={
        <Link
          href="/app/owner/venues"
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          Manage venues
          <HiArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-5">
              <Icon className="size-6 text-accent" />
              <p className="mt-7 text-3xl font-bold">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Recent owner activity</h2>
            <Link
              href="/app/owner/requests"
              className="text-xs font-semibold text-accent"
            >
              View activity
            </Link>
          </div>
          {logs.length > 0 ? (
            <div className="mt-4 grid gap-1">
              {logs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-xs last:border-0"
                >
                  <span className="font-semibold">
                    {log.action.replaceAll("_", " ")}
                  </span>
                  <span className="text-muted-foreground">
                    {activityDate.format(new Date(log.created_at))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Venue, court, rule and offline-block changes will appear here.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <Badge variant="accent">5% platform fee</Badge>
          <h2 className="mt-5 font-semibold">Commission preview</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Every slot editor shows the estimated 5% commission on the full slot
            price. It is informational until booking and payments are implemented.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
