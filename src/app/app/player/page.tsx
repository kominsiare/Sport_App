import Link from "next/link";
import { HiArrowRight, HiCalendarDays, HiMagnifyingGlass } from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PlayerHomePage() {
  return (
    <PageShell
      eyebrow="Player"
      title="Ready for your next game?"
      description="Browse approved Cricket, Football, Badminton, Pickleball and Tennis venues across Tricity."
      actions={
        <Link
          href="/app/player/venues"
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          Browse approved venues
          <HiArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <HiMagnifyingGlass className="size-6 text-accent" />
          <h2 className="mt-4 font-semibold">Find venues</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Filter the live approved catalog by sport, city, area and starting price.
          </p>
        </Card>
        <Card className="p-5">
          <HiCalendarDays className="size-6 text-accent" />
          <h2 className="mt-4 font-semibold">Track bookings</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Booking creation remains locked until the verified-payment workflow is built.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
