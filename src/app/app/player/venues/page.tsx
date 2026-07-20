import { VenueBrowser } from "@/components/marketplace/venue-browser";
import { PageShell } from "@/components/layout/page-shell";
import { getVenueCatalog } from "@/lib/venues/server";

export default async function PlayerVenuesPage() {
  const { venues, sports } = await getVenueCatalog();

  return (
    <PageShell
      eyebrow="Discover"
      title="Find and book a slot"
      description="Search approved Tricity venues, compare sports and prices, then reserve your court with a secure ₹500 advance."
    >
      <VenueBrowser venues={venues} sports={sports} />
    </PageShell>
  );
}
