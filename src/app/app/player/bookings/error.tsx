"use client";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

export default function PlayerBookingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <ErrorState
        title="Booking activity is unavailable"
        description="Pllayz could not refresh your payment holds. No new hold was created."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
