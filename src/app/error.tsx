"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/error-state";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4">
      <ErrorState
        description="The page could not be rendered. Try loading this view again."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
