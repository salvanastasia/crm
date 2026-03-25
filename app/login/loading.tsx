export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded-md bg-accent animate-pulse" />
              <div className="h-4 w-64 rounded-md bg-accent animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-full rounded-md bg-accent animate-pulse" />
            <div className="h-10 w-full rounded-md bg-accent animate-pulse" />
            <div className="h-10 w-full rounded-md bg-accent animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

