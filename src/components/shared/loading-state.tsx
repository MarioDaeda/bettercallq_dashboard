import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Caricamento contenuto" className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-9 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="rounded-2xl border bg-card p-5" key={index}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
