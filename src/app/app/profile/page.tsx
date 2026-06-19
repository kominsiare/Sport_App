import { HiEnvelope, HiMapPin, HiPhone, HiUser } from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";

const rows = [
  { label: "Full name", value: "Profile setup pending", icon: HiUser },
  { label: "Mobile", value: "Connect Supabase Auth", icon: HiPhone },
  { label: "Email", value: "Connect Supabase Auth", icon: HiEnvelope },
  { label: "City", value: "Choose during onboarding", icon: HiMapPin },
];

export default function ProfilePage() {
  return (
    <PageShell
      eyebrow="Account"
      title="Profile shell"
      description="Profile fields are intentionally non-functional until signup requirements are confirmed for Module 2."
      actions={<Badge variant="neutral">Placeholder</Badge>}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card className="divide-y divide-border">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-4 p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-secondary text-accent">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="mt-1 text-sm font-medium">{row.value}</p>
                </div>
              </div>
            );
          })}
        </Card>
        <EmptyState
          title="No capability switcher"
          description="The latest confirmed architecture uses separate Player and Venue Owner accounts, so this shell does not grant or switch account permissions."
        />
      </div>
    </PageShell>
  );
}
