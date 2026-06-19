import Link from "next/link";
import {
  HiArrowRight,
  HiBuildingOffice2,
  HiCalendarDays,
  HiInboxStack,
} from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const metrics = [
  {
    label: "Venue status",
    value: "Preview",
    icon: HiBuildingOffice2,
  },
  {
    label: "Generated slots",
    value: "—",
    icon: HiCalendarDays,
  },
  {
    label: "Booking activity",
    value: "—",
    icon: HiInboxStack,
  },
];

export default function OwnerHomePage() {
  return (
    <PageShell
      eyebrow="Venue owner"
      title="Your venue operations, in one place"
      description="This desktop-friendly shell is ready for ownership checks, venue approval states and live booking activity in later modules."
      actions={
        <Link
          href="/app/owner/venues"
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          Preview venues
          <HiArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <Icon className="size-6 text-accent" />
                <Badge variant="neutral">Module 1</Badge>
              </div>
              <p className="mt-8 text-2xl font-bold">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
