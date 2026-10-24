// Streaming skeleton for /explore — shown by Next.js Suspense while ExploreContent loads.
// Server component: no 'use client' needed for static pulse skeletons.

function ReportCardSkeleton() {
  return (
    <div className="relative bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
      {/* Regulation badge placeholder */}
      <div className="absolute top-2 right-2 w-8 h-4 rounded bg-zinc-800/50" />

      {/* Sprite row */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-1.5 sm:pb-2">
        <div className="bg-surface-alt/30 rounded-lg py-2">
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800/50"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="h-4 bg-zinc-800/50 rounded w-2/3" />
          <div className="h-4 bg-zinc-800/50 rounded w-10 flex-shrink-0" />
        </div>
        {/* Creator */}
        <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
        {/* Tags */}
        <div className="flex gap-1">
          <div className="h-3 bg-zinc-800/50 rounded-full w-16" />
          <div className="h-3 bg-zinc-800/50 rounded-full w-12" />
        </div>
        {/* Social + timestamp */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="h-3 bg-zinc-800/50 rounded w-8" />
            <div className="h-3 bg-zinc-800/50 rounded w-6" />
          </div>
          <div className="h-3 bg-zinc-800/50 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-12 pb-24 sm:pb-12">
        {/* Hero skeleton */}
        <div className="pt-3 sm:pt-10 pb-2 sm:pb-6 text-center animate-pulse">
          <div className="h-6 sm:h-8 bg-zinc-800/50 rounded w-48 sm:w-72 mx-auto" />
          <div className="mt-2 h-3 sm:h-4 bg-zinc-800/50 rounded w-64 sm:w-96 mx-auto hidden sm:block" />
        </div>

        {/* Filter bar skeleton */}
        <div className="sticky top-12 sm:top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-background/80 backdrop-blur-lg border-b border-border/40 mb-4 sm:mb-6 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-9 bg-zinc-800/50 rounded-lg" />
            <div className="w-24 h-9 bg-zinc-800/50 rounded-lg flex-shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 bg-zinc-800/50 rounded-full w-20" />
            ))}
          </div>
        </div>

        {/* Card grid — 6 skeleton cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
