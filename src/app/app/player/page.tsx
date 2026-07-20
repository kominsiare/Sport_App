import Link from "next/link";
import {
  HiArrowRight,
  HiCalendarDays,
  HiMagnifyingGlass,
  HiUserGroup,
} from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const playerActions = [
  {
    href: "/app/player/venues",
    title: "Find venues",
    description:
      "Filter the live approved catalog by sport, city, area and starting price.",
    cta: "Browse venues",
    icon: HiMagnifyingGlass,
  },
  {
    href: "/app/player/bookings",
    title: "Track bookings",
    description:
      "Review holds, confirmed bookings, payment status, and opponent finder options.",
    cta: "Open bookings",
    icon: HiCalendarDays,
  },
  {
    href: "/app/player/opponents",
    title: "Find opponents",
    description:
      "Publish a confirmed slot for challengers or join another team’s open match.",
    cta: "Open opponent finder",
    icon: HiUserGroup,
  },
];

export default function PlayerHomePage() {
  return (
    <PageShell
      eyebrow="Player"
      title="Ready for your next game?"
      description="Browse approved venues, lock your slot with Razorpay, and find opponent teams when your squad needs challengers."
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
      <div className="grid gap-4 md:grid-cols-3">
        {playerActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="focus-ring group block rounded-3xl"
            >
              <Card className="flex h-full flex-col p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-accent/45 group-hover:bg-white/[0.07] group-hover:shadow-[0_24px_70px_rgba(53,216,255,0.13)]">
                <Icon className="size-6 text-accent" />
                <h2 className="mt-4 font-semibold">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {action.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-accent">
                  {action.cta}
                  <HiArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
