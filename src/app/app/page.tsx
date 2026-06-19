import Link from "next/link";
import { HiArrowRight, HiBuildingOffice2, HiUserGroup } from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

const workspaces = [
  {
    href: "/app/player",
    title: "Player shell",
    description: "Discover sports venues and manage your booking journey.",
    icon: HiUserGroup,
  },
  {
    href: "/app/owner",
    title: "Owner shell",
    description: "View venue operations, slots and incoming booking activity.",
    icon: HiBuildingOffice2,
  },
];

export default function AppHomePage() {
  return (
    <PageShell
      eyebrow="Protected app placeholder"
      title="Choose a workspace preview"
      description="These links demonstrate separate Player and Venue Owner account shells. They do not grant permissions or create a session."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => {
          const Icon = workspace.icon;
          return (
            <Link key={workspace.href} href={workspace.href} className="focus-ring rounded-2xl">
              <Card className="group h-full p-5 transition hover:border-primary/60 hover:bg-[#0b1529]">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-accent">
                    <Icon className="size-6" />
                  </span>
                  <HiArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent" />
                </div>
                <h2 className="mt-6 font-semibold">{workspace.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {workspace.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
