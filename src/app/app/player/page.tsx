import Link from "next/link";
import {
  HiArrowRight,
  HiCalendarDays,
  HiCheckBadge,
  HiMagnifyingGlass,
  HiMapPin,
  HiShieldCheck,
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
    tone: "bg-primary/10 text-primary",
  },
  {
    href: "/app/player/bookings",
    title: "Track bookings",
    description:
      "Review holds, confirmed bookings, payment status, and opponent finder options.",
    cta: "Open bookings",
    icon: HiCalendarDays,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/app/player/opponents",
    title: "Find opponents",
    description:
      "Publish a confirmed slot for challengers or join another team’s open match.",
    cta: "Open opponent finder",
    icon: HiUserGroup,
    tone: "bg-sky-50 text-sky-700",
  },
];

export default function PlayerHomePage() {
  return (
    <PageShell
      eyebrow="Player"
      title="Ready to play?"
      description="Everything you need at your fingertips. Book a slot, track payment status, or find another team to play."
      actions={
        <Link
          href="/app/player/venues"
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          Book a slot
          <HiArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="motion-stagger grid gap-4 md:grid-cols-3">
        {playerActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="focus-ring group block rounded-3xl"
            >
              <Card className="flex h-full flex-col p-5 transition duration-200 group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_24px_60px_rgba(0,168,107,0.12)]">
                <span className={cn("grid size-12 place-items-center rounded-2xl", action.tone)}>
                  <Icon className="size-6" />
                </span>
                <h2 className="mt-4 font-semibold">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {action.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
                  {action.cta}
                  <HiArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                Upcoming booking
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-[-0.03em]">
                Your booking timeline lives here
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Confirmed bookings appear only after Razorpay’s webhook verifies
                the captured payment. Until then, the status stays clear.
              </p>
            </div>
            <span className="motion-pop grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <HiShieldCheck className="size-6" />
            </span>
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-secondary/60 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Advance</p>
              <p className="mt-1 font-bold">₹500</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment</p>
              <p className="mt-1 inline-flex items-center gap-1 font-bold text-primary">
                <HiCheckBadge className="size-4" />
                Verified
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Cities</p>
              <p className="mt-1 inline-flex items-center gap-1 font-bold">
                <HiMapPin className="size-4 text-primary" />
                Tricity
              </p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-sky-200 bg-sky-50/80 p-5">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-sky-700 shadow-sm">
              <HiUserGroup className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Invite your team</h2>
              <p className="mt-2 text-sm leading-6 text-sky-900/70">
                Book as a team, then open opponent search when you need a
                challenger for the same slot.
              </p>
              <Link
                href="/app/player/opponents"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-800"
              >
                See open matches
                <HiArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
