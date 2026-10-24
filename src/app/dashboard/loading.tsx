// Streaming skeleton for /dashboard — shown by Next.js Suspense while DashboardContent loads.
// Server component: no 'use client' needed for static pulse skeletons.

function DashboardCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
      {/* Sprite row */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-1.5">
        <div className="flex items-center justify-center gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-zinc-800/50" />
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="px-3 sm:px-4 pb-2 space-y-1.5">
        <div className="h-4 bg-zinc-800/50 rounded w-3/4" />
        <div className="h-3 bg-zinc-800/50 rounded w-1/3" />
      </div>

      {/* Controls row */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t border-border bg-surface-alt/30">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="h-6 w-16 bg-zinc-800/50 rounded-md" />
            <div className="h-6 w-12 bg-zinc-800/50 rounded-md" />
          </div>
          <div className="h-5 w-5 bg-zinc-800/50 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        {/* Header skeleton */}
        <div className="mb-4 sm:mb-8 flex items-center justify-between gap-3 animate-pulse">
          <div>
            <div className="h-7 sm:h-9 bg-zinc-800/50 rounded w-48 sm:w-64" />
            <div className="h-3 bg-zinc-800/50 rounded w-40 mt-1.5" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-24 bg-zinc-800/50 rounded-lg" />
            <div className="h-8 w-20 bg-zinc-800/50 rounded-lg" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mb-3 sm:mb-6 -mx-3 sm:mx-0 animate-pulse">
          <div className="flex items-center gap-1 px-3 sm:px-1 py-1 bg-surface-alt/50 sm:rounded-xl overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-zinc-800/50 rounded-lg flex-shrink-0 w-16 sm:w-20" />
            ))}
          </div>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DashboardCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
