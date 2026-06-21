import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function OwnerLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <LoadingSkeleton className="h-5 w-32" />
      <LoadingSkeleton className="mt-4 h-10 w-80 max-w-full" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-32" />
        ))}
      </div>
      <LoadingSkeleton className="mt-6 h-72" />
    </main>
  );
}
