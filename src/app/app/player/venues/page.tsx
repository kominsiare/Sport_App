import { VenueBrowser } from "@/components/marketplace/venue-browser";
import { PageShell } from "@/components/layout/page-shell";
import { getVenueCatalog } from "@/lib/venues/server";

export default async function PlayerVenuesPage() {
  const { venues, sports } = await getVenueCatalog();

  return (
    <PageShell
      eyebrow="Player · Venue browsing"
      title="Play across Tricity"
      description="Browse fictional beta venues backed by the live approved-venue catalog. Filter by sport, city, area, and starting price."
    >
      <VenueBrowser venues={venues} sports={sports} />
    </PageShell>
  );
}
