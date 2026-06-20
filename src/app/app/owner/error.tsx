"use client";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

export default function OwnerError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <ErrorState
        title="Owner operations could not load"
        description="The venue dashboard could not reach its live data. Try again."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
