"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  HiArrowRightOnRectangle,
  HiBars3,
  HiBuildingOffice2,
  HiCalendarDays,
  HiHome,
  HiInboxStack,
  HiMagnifyingGlass,
  HiShieldCheck,
  HiUser,
  HiUserGroup,
  HiXMark,
} from "react-icons/hi2";

import { Brand } from "@/components/brand/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
};

const playerNav: NavItem[] = [
  { href: "/app/player", label: "Home", icon: HiHome },
  { href: "/app/player/venues", label: "Venues", icon: HiMagnifyingGlass },
  { href: "/app/player/bookings", label: "Bookings", icon: HiCalendarDays },
  { href: "/app/player/opponents", label: "Opponents", icon: HiUserGroup },
  { href: "/app/profile", label: "Profile", icon: HiUser },
];

const ownerNav: NavItem[] = [
  { href: "/app/owner", label: "Dashboard", icon: HiHome },
  { href: "/app/owner/venues", label: "Venues", icon: HiBuildingOffice2 },
  { href: "/app/owner/requests", label: "Activity", icon: HiInboxStack },
  { href: "/app/profile", label: "Profile", icon: HiUser },
];

function NavLinks({
  items,
  pathname,
  onNavigate,
  compact = false,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/app/player" &&
            item.href !== "/app/owner" &&
            pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "focus-ring group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
              active &&
                "border border-primary/15 bg-primary/10 text-primary shadow-[0_10px_26px_rgba(0,168,107,0.12)]",
              compact &&
                "min-h-0 flex-1 flex-col gap-1 rounded-xl border-0 bg-transparent px-1 py-2 text-[10px]",
              compact &&
                active &&
                "bg-primary/8 text-primary shadow-none",
            )}
          >
            <Icon
              className={cn(
                "size-5 transition group-hover:text-primary",
                active && "text-primary",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function AccountSummary({ profile }: { profile: Profile }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-[0_14px_34px_rgba(16,24,20,0.06)]">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <HiShieldCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {profile.full_name ?? "Pllayz account"}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {profile.email ?? profile.phone}
          </p>
        </div>
      </div>

      {profile.account_type === "player" && !profile.can_book ? (
        <Link
          href="/onboarding?next=/app/player"
          className="focus-ring mt-3 inline-flex rounded-lg text-xs font-semibold text-amber-700"
        >
          Verify phone before booking
        </Link>
      ) : (
        <p className="mt-3 text-xs font-semibold text-primary">Account verified</p>
      )}

      <form action="/auth/signout" method="post" className="mt-3">
        <button
          type="submit"
          className="focus-ring flex min-h-9 w-full items-center gap-2 rounded-lg text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <HiArrowRightOnRectangle className="size-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ownerMode = profile.account_type === "owner";
  const items = ownerMode ? ownerNav : playerNav;

  return (
    <div className="arena-surface min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Brand compact />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <HiBars3 className="size-6" />
          </Button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm md:hidden">
          <aside className="glass-panel ml-auto flex h-full w-[min(86vw,340px)] flex-col rounded-l-[2rem] border-l border-border p-4">
            <div className="flex items-center justify-between">
              <Brand compact />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <HiXMark className="size-6" />
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {ownerMode ? "Owner workspace" : "Player workspace"}
              </p>
              <Badge variant={ownerMode ? "accent" : "default"}>
                {ownerMode ? "Owner" : "Player"}
              </Badge>
            </div>
            <nav className="mt-4 grid gap-1">
              <NavLinks
                items={items}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
            <div className="mt-auto">
              <AccountSummary profile={profile} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid min-h-dvh max-w-[1480px] md:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 hidden h-dvh border-r border-border bg-card/90 p-5 shadow-[18px_0_50px_rgba(16,24,20,0.04)] backdrop-blur-xl md:flex md:flex-col">
          <Brand />
          <div className="mt-10 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {ownerMode ? "Owner workspace" : "Player workspace"}
            </p>
            <Badge variant={ownerMode ? "accent" : "default"}>
              {ownerMode ? "Owner" : "Player"}
            </Badge>
          </div>
          <nav className="mt-4 grid gap-1">
            <NavLinks items={items} pathname={pathname} />
          </nav>
          <div className="mt-auto">
            <AccountSummary profile={profile} />
          </div>
        </aside>
        <div className="min-w-0 pb-20 md:pb-0">{children}</div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 rounded-[1.65rem] border border-border bg-card/95 p-1 shadow-[0_18px_55px_rgba(16,24,20,0.18)] backdrop-blur-xl md:hidden">
        <NavLinks items={items} pathname={pathname} compact />
      </nav>
    </div>
  );
}
