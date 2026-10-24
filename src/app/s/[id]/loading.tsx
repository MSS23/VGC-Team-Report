// Streaming skeleton for /s/[id] — shown by Next.js Suspense while the share page loads.
// Server component: no 'use client' needed for static pulse skeletons.

export default function ShareLoading() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-pulse">
        {/* Header: team name + regulation badge */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              {/* Tournament / team name */}
              <div className="h-7 sm:h-9 bg-zinc-800/50 rounded w-3/4" />
              {/* Creator byline */}
              <div className="h-4 bg-zinc-800/50 rounded w-1/3" />
            </div>
            {/* Regulation badge */}
            <div className="h-6 w-16 bg-zinc-800/50 rounded-md flex-shrink-0" />
          </div>
        </div>

        {/* 6 Pokemon sprite placeholder circles */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-surface-alt/30 rounded-xl py-4 px-4">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-zinc-800/50"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content area skeleton: two column blocks */}
        <div className="space-y-4 sm:space-y-6">
          {/* Summary block */}
          <div className="bg-surface border border-border rounded-xl px-4 py-4 space-y-2">
            <div className="h-4 bg-zinc-800/50 rounded w-24" />
            <div className="h-3 bg-zinc-800/50 rounded w-full" />
            <div className="h-3 bg-zinc-800/50 rounded w-5/6" />
            <div className="h-3 bg-zinc-800/50 rounded w-4/6" />
          </div>

          {/* Pokemon detail cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl overflow-hidden"
              >
                {/* Sprite + name */}
                <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-zinc-800/50 flex-shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-4 bg-zinc-800/50 rounded w-2/3" />
                    <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
                  </div>
                </div>
                {/* Stat bars */}
                <div className="px-4 pb-4 space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-2.5 bg-zinc-800/50 rounded-full w-8 flex-shrink-0" />
                      <div
                        className="h-2.5 bg-zinc-800/50 rounded-full"
                        style={{ width: `${55 + j * 10}%` }}
                      />
                    </div>
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
