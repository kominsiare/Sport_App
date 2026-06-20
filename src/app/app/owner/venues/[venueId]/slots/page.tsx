import { notFound } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { OwnerSlotManager } from "@/components/owner/owner-slot-manager";
import { requireAccountType } from "@/lib/auth/server";
import { getOwnerVenueOperations } from "@/lib/owner/server";

export default async function OwnerVenueSlotsPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const [profile, data] = await Promise.all([
    requireAccountType("owner"),
    getOwnerVenueOperations(venueId),
  ]);

  if (!data) notFound();

  return (
    <PageShell
      eyebrow="Owner · Venue operations"
      title={data.venue.name}
      description="Configure courts, supported sports and recurring weekly rules. Future unbooked slots update immediately."
      className="max-w-7xl"
    >
      <OwnerSlotManager ownerUserId={profile.id} data={data} />
    </PageShell>
  );
}
