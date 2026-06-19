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
      description="The player workspace will become live after Supabase Auth and venue data are connected."
      actions={
        <Link
          href="/app/player/venues"
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          Preview venue layout
          <HiArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <HiMagnifyingGlass className="size-6 text-accent" />
          <h2 className="mt-4 font-semibold">Find venues</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Filter by sport and Tricity location. Live inventory remains locked until login
            is implemented.
          </p>
        </Card>
        <Card className="p-5">
          <HiCalendarDays className="size-6 text-accent" />
          <h2 className="mt-4 font-semibold">Track bookings</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Booking status components are ready for the later verified-payment workflow.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
