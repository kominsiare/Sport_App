import { PageShell } from "@/components/layout/page-shell";
import { OwnerVenueManager } from "@/components/owner/owner-venue-manager";
import { requireAccountType } from "@/lib/auth/server";
import { getOwnerDashboardData } from "@/lib/owner/server";

export default async function OwnerVenuesPage() {
  const [profile, { venues }] = await Promise.all([
    requireAccountType("owner"),
    getOwnerDashboardData(),
  ]);

  return (
    <PageShell
      eyebrow="Owner · Venues"
      title="Manage your venue portfolio"
      description="Only you can access these drafts and operations. Player visibility starts after admin approval."
      className="max-w-7xl"
    >
      <OwnerVenueManager ownerUserId={profile.id} venues={venues} />
    </PageShell>
  );
}
