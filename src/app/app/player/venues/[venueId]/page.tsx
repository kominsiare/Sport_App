import { CourtRow } from "@/components/marketplace/court-row";
import { SlotPreview } from "@/components/app/slot-preview";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PlayerVenueDetailPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  await params;

  return (
    <PageShell
      eyebrow="Mock venue detail"
      title="Night Match Arena"
      description="A read-only layout preview. Live prices and availability will come from Supabase in Module 3."
      actions={<Badge variant="neutral">Mock data</Badge>}
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Courts and turfs</CardTitle>
          </CardHeader>
          <CardContent>
            <CourtRow
              name="Floodlit multi-sport turf"
              type="Outdoor"
              duration="Sport-specific duration"
              price="₹2,500"
            />
            <CourtRow
              name="Blue hard court"
              type="Racket"
              duration="60-minute preview"
              price="₹1,200"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Slot cell states</CardTitle>
          </CardHeader>
          <CardContent>
            <SlotPreview />
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Selection is visual only. Availability is rechecked server-side before any
              future booking hold.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
