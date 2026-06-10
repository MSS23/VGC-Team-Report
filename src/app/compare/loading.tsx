// Streaming skeleton for /compare — shown by Next.js Suspense while CompareContent loads.
// Server component: no 'use client' needed for static pulse skeletons.

export default function CompareLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-background text-text-primary"
    >
      <span className="sr-only">Loading…</span>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12 animate-pulse">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="h-8 sm:h-10 bg-zinc-800/50 rounded w-56 sm:w-72 mx-auto" />
          <div className="mt-3 h-3 sm:h-4 bg-zinc-800/50 rounded w-72 sm:w-96 mx-auto" />
        </div>

        {/* Two-column textarea inputs (Team A / Team B) */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team A */}
            <div>
              <div className="h-3 bg-zinc-800/50 rounded w-16 mb-2" />
              <div className="h-9 bg-zinc-800/50 rounded-lg w-full mb-2" />
              <div className="h-48 bg-zinc-800/50 rounded-xl w-full" />
            </div>
            {/* Team B */}
            <div>
              <div className="h-3 bg-zinc-800/50 rounded w-16 mb-2" />
              <div className="h-9 bg-zinc-800/50 rounded-lg w-full mb-2" />
              <div className="h-48 bg-zinc-800/50 rounded-xl w-full" />
            </div>
          </div>

          {/* Compare button */}
          <div className="flex justify-center">
            <div className="h-11 w-48 bg-zinc-800/50 rounded-xl" />
          </div>

          {/* Footer hint */}
          <div className="h-3 bg-zinc-800/50 rounded w-3/4 sm:w-1/2 mx-auto" />
        </div>

        {/* Optional results-style preview blocks below for tall-screen warmth */}
        <div className="mt-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, col) => (
              <div key={col} className="space-y-3">
                <div className="h-3 bg-zinc-800/50 rounded w-16" />
                <div className="flex items-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800/50"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
