import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function Brand({ href = "/", compact = false, className }: BrandProps) {
  return (
    <Link
      href={href}
      aria-label="Pllayz home"
      className={cn("focus-ring inline-flex items-center gap-2 rounded-lg", className)}
    >
      <Image
        src="/assets/pllayz-mark.png"
        alt=""
        width={44}
        height={44}
        priority
        className={cn("object-contain", compact ? "size-7" : "size-9")}
      />
      <span
        className={cn(
          "font-display font-bold tracking-[-0.04em] text-foreground",
          compact ? "text-xl" : "text-3xl",
        )}
      >
        Pllayz
      </span>
    </Link>
  );
}
