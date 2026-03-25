import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      <div className="flex items-center mb-2">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-[2fr_2fr_2fr_1fr_120px] gap-2 px-2 py-3 border-b">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className="grid grid-cols-[2fr_2fr_2fr_1fr_120px] gap-2 px-2 py-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
              <Skeleton className="h-4 w-44 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

