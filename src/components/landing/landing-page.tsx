"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  HiArrowRight,
  HiBolt,
  HiClock,
  HiLifebuoy,
  HiLockClosed,
  HiMapPin,
  HiShieldCheck,
  HiBuildingStorefront,
} from "react-icons/hi2";

import { Brand } from "@/components/brand/brand";
import { SportChip } from "@/components/marketplace/sport-chip";
import { buttonVariants } from "@/components/ui/button";
import { sports, type SportName } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const trustItems = [
  {
    icon: HiShieldCheck,
    title: "Trusted venues",
    description: "Admin-approved listings",
  },
  {
    icon: HiClock,
    title: "Secure holds",
    description: "Protected booking windows",
  },
  {
    icon: HiLifebuoy,
    title: "Human support",
    description: "Admin-led beta support",
  },
];

export function LandingPage() {
  const [sport, setSport] = useState<SportName>("Cricket");
  const playerHref = `/login?next=${encodeURIComponent("/app/player/venues")}&sport=${sport.toLowerCase()}`;

  return (
    <main className="min-h-dvh overflow-hidden bg-background">
      <section className="relative mx-auto max-w-[1480px] lg:grid lg:min-h-dvh lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[570px] overflow-hidden border-b border-border lg:min-h-dvh lg:border-b-0 lg:border-r">
          <Image
            src="/assets/night-match-hero.png"
            alt="Cricket, football and racket-sport players competing under floodlights"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 54vw"
            className="object-cover object-[50%_64%] lg:object-[50%_60%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,18,.18)_0%,rgba(2,6,18,.12)_32%,rgba(2,6,18,.82)_74%,#030712_100%)] lg:bg-[linear-gradient(90deg,rgba(2,6,18,.2)_0%,rgba(2,6,18,.1)_55%,rgba(2,6,18,.78)_100%)]" />
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-[max(22px,env(safe-area-inset-top))] md:px-8 lg:px-12">
            <Brand />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/25 bg-black/25 px-5 backdrop-blur-md hover:bg-black/50",
              )}
            >
              Log in
            </Link>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-8 md:px-8 lg:px-12 lg:pb-14">
            <div className="enter-up max-w-2xl border-l border-white/80 pl-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Tricity first
              </p>
              <h1 className="font-display mt-3 max-w-[650px] text-[clamp(3.8rem,15vw,7.6rem)] font-semibold uppercase leading-[0.82] tracking-[-0.045em] text-white">
                Play where
                <br />
                the <span className="text-accent">city</span> plays
              </h1>
              <p className="mt-5 flex items-center gap-2 text-sm text-slate-200 md:text-base">
                <HiMapPin className="size-5 shrink-0 text-accent" />
                Chandigarh · Mohali · Panchkula
              </p>
            </div>
          </div>
        </div>

        <div className="night-grid relative px-5 py-8 md:px-8 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto w-full max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Choose your sport
            </p>
            <div className="-mx-2 mt-4 flex gap-1 overflow-x-auto px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:justify-between">
              {sports.map((item) => (
                <SportChip
                  key={item}
                  sport={item}
                  selected={sport === item}
                  onSelect={setSport}
                />
              ))}
            </div>

            <div className="mt-3 grid gap-3">
              <Link
                href={playerHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "blue-glow h-16 justify-between rounded-2xl px-6 text-lg",
                )}
              >
                <span className="flex items-center gap-3">
                  <HiBolt className="size-6 text-accent" />
                  Find your game
                </span>
                <HiArrowRight className="size-5" />
              </Link>
              <Link
                href="/login?next=/app/owner"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-14 justify-between border-accent/80 px-6 text-base",
                )}
              >
                <span className="flex items-center gap-3">
                  <HiBuildingStorefront className="size-6 text-accent" />
                  List your venue
                </span>
                <HiArrowRight className="size-5" />
              </Link>
            </div>

            <section className="relative mt-7 overflow-hidden rounded-2xl border border-border bg-[#081020]/90 px-5 pb-4 pt-8 text-center">
              <span className="absolute left-1/2 top-0 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-[#101b34] text-[#8ca6ff] shadow-xl">
                <HiLockClosed className="size-6" />
              </span>
              <h2 className="text-lg font-semibold">
                Sign in to unlock{" "}
                <span className="text-accent">venue availability</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse live slots and book after you log in.
              </p>
              <Image
                src="/assets/tricity-skyline.png"
                alt=""
                width={1086}
                height={362}
                className="mt-4 h-auto w-full opacity-70"
              />
            </section>

            <div className="mt-7 grid grid-cols-3 divide-x divide-border border-y border-border py-5">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="px-2 text-center sm:px-4">
                    <Icon className="mx-auto size-6 text-accent" />
                    <p className="mt-2 text-[11px] font-semibold text-foreground sm:text-xs">
                      {item.title}
                    </p>
                    <p className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Pllayz currently supports Cricket, Football, Badminton, Pickleball and Tennis.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
