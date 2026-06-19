import { VenueBrowserPreview } from "@/components/app/venue-browser-preview";
import { PageShell } from "@/components/layout/page-shell";

export default function PlayerVenuesPage() {
  return (
    <PageShell
      eyebrow="Player · Venue browsing"
      title="Venue discovery layout"
      description="Local mock content demonstrates the reusable card and filter system. No network calls or real venue records are exposed."
    >
      <VenueBrowserPreview />
    </PageShell>
  );
}
