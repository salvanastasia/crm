import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-4 w-56 rounded-md" />
        </div>
        <Skeleton className="h-10 w-44 rounded-md" />
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-2 px-2 py-3 border-b">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
        </div>

        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-2 px-2 py-3">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
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

