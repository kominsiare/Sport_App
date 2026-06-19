import { SlotPreview } from "@/components/app/slot-preview";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OwnerVenueSlotsPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  await params;

  return (
    <PageShell
      eyebrow="Owner · Slot editor"
      title="Weekly availability layout"
      description="The interface is interactive, but it does not save changes. Weekly rules, 7-day generation and overlap protection belong to later approved modules."
      actions={<Badge variant="neutral">No database connection</Badge>}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monday · Floodlit turf</CardTitle>
          </CardHeader>
          <CardContent>
            <SlotPreview />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>State legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Available</span>
              <Badge variant="neutral">Open</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Selected for editing</span>
              <Badge variant="default">Selected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Existing booking</span>
              <Badge variant="danger">Locked</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
