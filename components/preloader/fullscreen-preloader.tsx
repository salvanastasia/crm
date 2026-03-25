import { Skeleton } from "@/components/ui/skeleton"

export function FullscreenPreloader() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border/50 bg-background p-4">
              <Skeleton className="h-4 w-24" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border/50 bg-background p-4 lg:col-span-2">
            <Skeleton className="h-6 w-48" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-5 w-full" />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background p-4">
            <Skeleton className="h-6 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-5 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

