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
    <main className="arena-surface min-h-dvh overflow-hidden bg-background">
      <section className="relative mx-auto max-w-[1480px] lg:grid lg:min-h-dvh lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[405px] overflow-hidden border-b border-white/10 md:min-h-[500px] lg:min-h-dvh lg:border-b-0 lg:border-r">
          <Image
            src="/assets/night-match-hero.png"
            alt="Cricket, football and racket-sport players competing under floodlights"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 54vw"
            className="object-cover object-[50%_64%] lg:object-[50%_60%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,18,.18)_0%,rgba(2,6,18,.12)_32%,rgba(2,6,18,.82)_74%,#030712_100%)] lg:bg-[linear-gradient(90deg,rgba(2,6,18,.2)_0%,rgba(2,6,18,.1)_55%,rgba(2,6,18,.78)_100%)]" />
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] md:px-8 md:pt-6 lg:px-12">
            <Brand compact />
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

          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4 md:px-8 md:pb-8 lg:px-12 lg:pb-14">
            <div className="enter-up max-w-2xl border-l border-white/80 pl-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Tricity first
              </p>
              <h1 className="font-display mt-2 max-w-[650px] text-[clamp(2.85rem,11.7vw,7.6rem)] font-semibold uppercase leading-[0.84] tracking-[-0.045em] text-white">
                <span className="block whitespace-nowrap">Play where</span>
                <span className="block whitespace-nowrap">
                  the <span className="text-accent">city</span> plays
                </span>
              </h1>
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-200 md:mt-5 md:text-base">
                <HiMapPin className="size-5 shrink-0 text-accent" />
                Chandigarh · Mohali · Panchkula
              </p>
            </div>
          </div>
        </div>

        <div className="night-grid relative px-5 py-4 md:px-8 md:py-8 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto w-full max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Choose your sport
            </p>
            <div className="-mx-2 mt-3 flex gap-1 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mt-4 md:pb-4 lg:justify-between">
              {sports.map((item) => (
                <SportChip
                  key={item}
                  sport={item}
                  selected={sport === item}
                  onSelect={setSport}
                />
              ))}
            </div>

            <div className="mt-2 grid gap-2 md:mt-3 md:gap-3">
              <Link
                href={playerHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "blue-glow h-14 justify-between rounded-2xl px-5 text-base md:h-16 md:px-6 md:text-lg",
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
                  "h-12 justify-between border-accent/80 px-5 text-sm md:h-14 md:px-6 md:text-base",
                )}
              >
                <span className="flex items-center gap-3">
                  <HiBuildingStorefront className="size-6 text-accent" />
                  List your venue
                </span>
                <HiArrowRight className="size-5" />
              </Link>
            </div>

            <section className="glass-panel relative mt-4 rounded-[2rem] px-4 pb-1 pt-5 text-center md:mt-7 md:px-5 md:pb-4 md:pt-8">
              <span className="absolute left-1/2 top-0 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-white/10 bg-[#101b34] text-[#8ca6ff] shadow-xl md:size-12">
                <HiLockClosed className="size-5 md:size-6" />
              </span>
              <h2 className="text-base font-semibold md:text-lg">
                Sign in to unlock{" "}
                <span className="text-accent">venue availability</span>
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground md:mt-2 md:text-sm">
                Browse live slots and book after you log in.
              </p>
              <Image
                src="/assets/tricity-skyline.png"
                alt=""
                width={1086}
                height={362}
                className="mt-1 h-10 w-full object-contain opacity-70 md:mt-4 md:h-auto"
              />
            </section>

            <div className="glass-panel mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-[1.75rem] py-2 md:mt-7 md:py-5">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="px-2 text-center sm:px-4">
                    <Icon className="mx-auto size-5 text-accent md:size-6" />
                    <p className="mt-1 text-[10px] font-semibold text-foreground sm:mt-2 sm:text-xs">
                      {item.title}
                    </p>
                    <p className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 hidden text-center text-xs text-muted-foreground sm:block">
              Pllayz currently supports Cricket, Football, Badminton, Pickleball and Tennis.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
