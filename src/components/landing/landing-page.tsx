"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  HiArrowRight,
  HiBuildingStorefront,
  HiCheckBadge,
  HiCreditCard,
  HiMapPin,
  HiShieldCheck,
  HiSparkles,
  HiUserGroup,
} from "react-icons/hi2";

import { Brand } from "@/components/brand/brand";
import { SportChip } from "@/components/marketplace/sport-chip";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sports, type SportName } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const trustItems = [
  {
    icon: HiShieldCheck,
    title: "Verified venues",
    description: "Approved before players can book.",
  },
  {
    icon: HiCreditCard,
    title: "Razorpay advance",
    description: "Pay ₹500 securely to hold a slot.",
  },
  {
    icon: HiCheckBadge,
    title: "Clear status",
    description: "Bookings confirm after webhook verification.",
  },
];

export function LandingPage() {
  const [sport, setSport] = useState<SportName>("Football");
  const playerHref = `/login?next=${encodeURIComponent("/app/player/venues")}&sport=${sport.toLowerCase()}`;

  return (
    <main className="arena-surface min-h-dvh overflow-hidden bg-background px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Brand />
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-5")}
        >
          Log in
        </Link>
      </div>

      <section className="mx-auto grid max-w-6xl gap-8 py-10 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="motion-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
            <HiSparkles className="size-4" />
            Tricity sports, one app
          </p>
          <h1 className="mt-5 text-5xl font-bold leading-[0.98] tracking-[-0.06em] text-foreground md:text-7xl">
            Play more.
            <span className="block text-primary">Book faster.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
            Discover verified venues, reserve a slot with a ₹500 advance, and
            find opponent teams without turning booking day into admin day.
          </p>

          <div className="motion-stagger mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href={playerHref}
              className="focus-ring group rounded-3xl border border-primary/25 bg-card p-4 shadow-[0_16px_42px_rgba(16,24,20,0.08)] transition hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_22px_58px_rgba(0,168,107,0.16)]"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <HiUserGroup className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold">I’m a Player</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Book slots, track payments, find opponents.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Start booking
                <HiArrowRight className="size-4 transition group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/login?next=/app/owner"
              className="focus-ring group rounded-3xl border border-border bg-card p-4 shadow-[0_16px_42px_rgba(16,24,20,0.06)] transition hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_22px_58px_rgba(16,24,20,0.1)]"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
                <HiBuildingStorefront className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold">I’m an Owner</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Manage venues, slots, bookings and payouts.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Manage venue
                <HiArrowRight className="size-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sports.map((item) => (
              <SportChip
                key={item}
                sport={item}
                selected={sport === item}
                onSelect={setSport}
                compact
              />
            ))}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-border bg-card/80 p-4">
                  <Icon className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="motion-rise relative">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-primary/10 blur-3xl" />
          <Card className="relative overflow-hidden rounded-[2rem] p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.55rem]">
              <Image
                src="/assets/night-match-hero.png"
                alt="Players competing on floodlit sports courts"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover object-[50%_62%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/12 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="flex items-center gap-2 text-sm font-medium text-white/85">
                  <HiMapPin className="size-5 text-[#d8ff35]" />
                  Chandigarh · Mohali · Panchkula
                </p>
                <h2 className="mt-2 max-w-md text-3xl font-bold tracking-[-0.04em]">
                  Your sports slot, sorted.
                </h2>
              </div>
            </div>

            <div className="grid gap-3 p-2 pt-5 sm:grid-cols-3">
              {[
                ["20+", "verified venues"],
                ["₹500", "secure advance"],
                ["5%", "owner fee clarity"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-secondary p-4">
                  <p className="text-2xl font-bold tracking-[-0.03em]">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
