"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  HiBars3,
  HiBuildingOffice2,
  HiCalendarDays,
  HiHome,
  HiInboxStack,
  HiMagnifyingGlass,
  HiUser,
  HiXMark,
} from "react-icons/hi2";

import { Brand } from "@/components/brand/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
};

const playerNav: NavItem[] = [
  { href: "/app/player", label: "Home", icon: HiHome },
  { href: "/app/player/venues", label: "Venues", icon: HiMagnifyingGlass },
  { href: "/app/player/bookings", label: "Bookings", icon: HiCalendarDays },
  { href: "/app/profile", label: "Profile", icon: HiUser },
];

const ownerNav: NavItem[] = [
  { href: "/app/owner", label: "Dashboard", icon: HiHome },
  { href: "/app/owner/venues", label: "Venues", icon: HiBuildingOffice2 },
  { href: "/app/owner/requests", label: "Requests", icon: HiInboxStack },
  { href: "/app/profile", label: "Profile", icon: HiUser },
];

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
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
              "focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
              active && "bg-primary/15 text-white",
            )}
          >
            <Icon className={cn("size-5", active && "text-accent")} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ownerMode = pathname.startsWith("/app/owner");
  const items = ownerMode ? ownerNav : playerNav;

  return (
    <div className="min-h-dvh bg-background">
      <div className="border-b border-amber-300/20 bg-amber-300/10 px-4 py-2 text-center text-xs text-amber-100">
        Module 1 design preview · Real authentication and protected data arrive in Module 2.
      </div>
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
        <div className="fixed inset-0 z-50 bg-black/75 md:hidden">
          <aside className="ml-auto flex h-full w-[min(86vw,340px)] flex-col border-l border-border bg-card p-4">
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
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid min-h-[calc(100dvh-33px)] max-w-[1480px] md:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 hidden h-dvh border-r border-border bg-[#050b17] p-5 md:flex md:flex-col">
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
          <div className="mt-auto rounded-2xl border border-border bg-secondary/50 p-4">
            <p className="text-xs font-semibold text-foreground">Separate account types</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Player and owner permissions never change from this navigation.
            </p>
            <Link
              href={ownerMode ? "/app/player" : "/app/owner"}
              className="focus-ring mt-3 inline-flex rounded-lg text-xs font-semibold text-accent"
            >
              Preview {ownerMode ? "player" : "owner"} shell
            </Link>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
