"use client";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

export default function VenueError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <ErrorState
        title="Venue discovery is unavailable"
        description="Pllayz could not load the approved venue catalog. Check the connection and try again."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
