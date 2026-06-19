import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function PageLoading() {
  return (
    <div className="space-y-5">
      <LoadingSkeleton className="h-12 w-2/3" />
      <LoadingSkeleton className="h-5 w-full max-w-xl" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-border p-4">
            <LoadingSkeleton className="aspect-[16/10] w-full" />
            <LoadingSkeleton className="h-5 w-1/2" />
            <LoadingSkeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
