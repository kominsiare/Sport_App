import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pulse-soft rounded-xl bg-[linear-gradient(90deg,#101827,#17233e,#101827)] bg-[length:220%_100%]",
        className,
      )}
    />
  );
}
