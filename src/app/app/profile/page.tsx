import Link from "next/link";
import {
  HiBuildingOffice2,
  HiEnvelope,
  HiMapPin,
  HiPhone,
  HiUser,
} from "react-icons/hi2";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireCompleteProfile } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const profile = await requireCompleteProfile();
  const rows = [
    { label: "Full name", value: profile.full_name ?? "Not set", icon: HiUser },
    ...(profile.account_type === "owner"
      ? [
          {
            label: "Business name",
            value: profile.business_name ?? "Not set",
            icon: HiBuildingOffice2,
          },
        ]
      : []),
    {
      label: "Mobile",
      value: profile.phone ?? "Not connected",
      icon: HiPhone,
      verified: Boolean(profile.phone_verified_at),
    },
    {
      label: "Email",
      value: profile.email ?? "Not connected",
      icon: HiEnvelope,
      verified: Boolean(profile.email_verified_at),
    },
    { label: "City", value: profile.city ?? "Not set", icon: HiMapPin },
  ];

  return (
    <PageShell
      eyebrow="Account"
      title={profile.full_name ?? "Your profile"}
      description="Your account type is permanent. Profile details and missing contact verification can be managed here."
      actions={
        <Link
          href="/onboarding?next=/app/profile"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          Manage profile
        </Link>
      }
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
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="mt-1 truncate text-sm font-medium">{row.value}</p>
                </div>
                {"verified" in row ? (
                  <Badge variant={row.verified ? "accent" : "warning"}>
                    {row.verified ? "Verified" : "Required"}
                  </Badge>
                ) : null}
              </div>
            );
          })}
        </Card>

        <Card className="p-5">
          <Badge variant={profile.account_type === "owner" ? "accent" : "default"}>
            {profile.account_type === "owner" ? "Venue Owner" : "Player"}
          </Badge>
          <h2 className="mt-5 font-semibold">Account permissions</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {profile.account_type === "owner"
              ? "This account can manage its own venues. It cannot make player bookings."
              : profile.can_book
                ? "This account can browse venues and meets the verified-phone requirement for future bookings."
                : "This account can browse venues. Verify a mobile number before a future booking can be created."}
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
