import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="night-grid grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display text-8xl font-bold text-primary">404</p>
        <h1 className="mt-3 text-2xl font-bold">This court is out of bounds</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you requested does not exist.
        </p>
        <Link href="/" className={cn(buttonVariants(), "mt-6")}>
          Back to Pllayz
        </Link>
      </div>
    </main>
  );
}
