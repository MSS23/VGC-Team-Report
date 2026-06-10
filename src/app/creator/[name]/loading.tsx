// Streaming skeleton for /creator/[name] — shown by Next.js Suspense while CreatorProfile loads.
// Server component: no 'use client' needed for static pulse skeletons.

function ReportCardSkeleton() {
  return (
    <div className="relative bg-surface rounded-xl border border-border overflow-hidden">
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
        <div className="flex items-start justify-between gap-1.5">
          <div className="h-4 bg-zinc-800/50 rounded w-2/3" />
          <div className="h-4 bg-zinc-800/50 rounded w-10 flex-shrink-0" />
        </div>
        <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
        <div className="flex gap-1">
          <div className="h-3 bg-zinc-800/50 rounded-full w-16" />
          <div className="h-3 bg-zinc-800/50 rounded-full w-12" />
        </div>
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

export default function CreatorLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-background text-text-primary"
    >
      <span className="sr-only">Loading…</span>
      <main className="pb-24 sm:pb-12">
        {/* Hero with avatar */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 animate-pulse">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800/50 ring-4 ring-background shadow-lg" />
              </div>
              {/* Name + meta */}
              <div className="flex-1 w-full text-center sm:text-left pb-1 space-y-2.5">
                <div className="h-7 sm:h-9 bg-zinc-800/50 rounded w-48 sm:w-64 mx-auto sm:mx-0" />
                <div className="h-3 bg-zinc-800/50 rounded w-32 mx-auto sm:mx-0" />
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                  <div className="h-8 w-24 bg-zinc-800/50 rounded-lg" />
                  <div className="h-9 w-9 bg-zinc-800/50 rounded-lg" />
                  <div className="h-9 w-9 bg-zinc-800/50 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-4 space-y-2"
              >
                <div className="h-6 bg-zinc-800/50 rounded w-12 mx-auto" />
                <div className="h-3 bg-zinc-800/50 rounded w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Sort / filter bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4 animate-pulse">
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 bg-zinc-800/50 rounded w-32" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 bg-zinc-800/50 rounded-lg" />
              <div className="h-8 w-20 bg-zinc-800/50 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Report card grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ReportCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
