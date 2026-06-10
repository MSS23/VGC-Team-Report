// Streaming skeleton for /champions — shown by Next.js Suspense while ChampionsContent loads.
// Server component: no 'use client' needed for static pulse skeletons.

export default function ChampionsLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-background text-text-primary"
    >
      <span className="sr-only">Loading…</span>
      <main className="pb-24 sm:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto text-center animate-pulse">
            {/* Badge */}
            <div className="inline-block h-6 w-40 rounded-full bg-zinc-800/50 mb-6" />
            {/* Title (two lines) */}
            <div className="h-8 sm:h-10 bg-zinc-800/50 rounded w-64 sm:w-80 mx-auto" />
            <div className="mt-2 h-8 sm:h-10 bg-zinc-800/50 rounded w-72 sm:w-96 mx-auto" />
            {/* Subtitle */}
            <div className="mt-4 h-4 bg-zinc-800/50 rounded w-3/4 sm:w-2/3 mx-auto" />
            <div className="mt-2 h-4 bg-zinc-800/50 rounded w-2/3 sm:w-1/2 mx-auto" />
            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="h-11 w-48 bg-zinc-800/50 rounded-xl" />
              <div className="h-11 w-52 bg-zinc-800/50 rounded-xl" />
            </div>
          </div>
        </section>

        {/* What is Pokemon Champions */}
        <section className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-6 sm:h-7 bg-zinc-800/50 rounded w-64 mb-5" />
          <div className="space-y-2.5">
            <div className="h-3 bg-zinc-800/50 rounded w-full" />
            <div className="h-3 bg-zinc-800/50 rounded w-11/12" />
            <div className="h-3 bg-zinc-800/50 rounded w-10/12" />
            <div className="h-3 bg-zinc-800/50 rounded w-9/12" />
          </div>
        </section>

        {/* Featured Mega Evolutions */}
        <section className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-6 sm:h-7 bg-zinc-800/50 rounded w-56 mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-surface p-4 space-y-2"
              >
                <div className="h-4 bg-zinc-800/50 rounded w-3/4" />
                <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
                <div className="flex gap-1.5 mt-2">
                  <div className="h-4 w-12 bg-zinc-800/50 rounded-full" />
                  <div className="h-4 w-14 bg-zinc-800/50 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample Teams */}
        <section className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-6 sm:h-7 bg-zinc-800/50 rounded w-72 mb-2" />
          <div className="h-3 bg-zinc-800/50 rounded w-1/2 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-surface p-5 space-y-3"
              >
                <div className="h-4 bg-zinc-800/50 rounded w-2/3" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-zinc-800/50 rounded w-full" />
                  <div className="h-3 bg-zinc-800/50 rounded w-5/6" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 w-14 bg-zinc-800/50 rounded-full" />
                  ))}
                </div>
                <div className="h-8 bg-zinc-800/50 rounded-lg w-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Meta Snapshot placeholder */}
        <section className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-6 sm:h-7 bg-zinc-800/50 rounded w-56 mb-5" />
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-zinc-800/50 rounded w-1/3" />
                  <div className="h-2 bg-zinc-800/50 rounded w-2/3" />
                </div>
                <div className="h-4 w-10 bg-zinc-800/50 rounded" />
              </div>
            ))}
          </div>
        </section>

        {/* Top Cut table */}
        <section className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-6 sm:h-7 bg-zinc-800/50 rounded w-72 mb-2" />
          <div className="h-3 bg-zinc-800/50 rounded w-2/3 mb-6" />
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="bg-surface-alt h-10 border-b border-border" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 bg-surface"
              >
                <div className="h-4 w-8 bg-zinc-800/50 rounded" />
                <div className="h-4 w-32 bg-zinc-800/50 rounded" />
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-5 w-20 bg-zinc-800/50 rounded-full" />
                  ))}
                </div>
                <div className="h-4 w-12 bg-zinc-800/50 rounded" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
