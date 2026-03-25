export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-52 rounded-md bg-accent animate-pulse" />
              <div className="h-4 w-72 rounded-md bg-accent animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-border/50 bg-background p-4">
                <div className="h-4 w-24 rounded-md bg-accent animate-pulse" />
                <div className="mt-3 space-y-2">
                  <div className="h-5 w-full rounded-md bg-accent animate-pulse" />
                  <div className="h-4 w-2/3 rounded-md bg-accent animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

