import { Skeleton } from "@/components/ui/skeleton"

export function GlobalPreloader() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-44 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
        </div>

        <div className="flex items-center">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_2fr_2fr_120px] gap-2 px-3 py-2 border-b">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-14 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                className="grid grid-cols-[2fr_1fr_2fr_2fr_120px] gap-2 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-44 rounded-md" />
                </div>
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

