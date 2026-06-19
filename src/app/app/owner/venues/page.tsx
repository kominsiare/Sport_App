import Link from "next/link";
import { HiArrowRight, HiBuildingOffice2 } from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function OwnerVenuesPage() {
  return (
    <PageShell
      eyebrow="Owner · Venues"
      title="Venue management shell"
      description="Owners will create and manage only their own venues. Admin approval is required before a venue becomes visible or bookable."
    >
      <Card className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-accent">
              <HiBuildingOffice2 className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">Night Match Arena</h2>
                <Badge variant="warning">Mock · pending review</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Chandigarh · Multi-sport venue layout preview
              </p>
            </div>
          </div>
          <Link
            href="/app/owner/venues/demo-venue/slots"
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
          >
            View slot layout
            <HiArrowRight className="size-4" />
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
