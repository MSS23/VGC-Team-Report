/** Pokémon card skeleton grid for the shared-report loading state, moved verbatim out of HomePageClient.tsx. */
export function SharedReportSkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="skeleton w-[76px] h-[76px] rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-28" />
              <div className="flex gap-1">
                <div className="skeleton h-5 w-14 rounded-full" />
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
              <div className="skeleton h-4 w-36" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="skeleton h-9 rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <div className="skeleton h-3 w-8" />
                <div className="skeleton h-2.5 flex-1 rounded-full" />
                <div className="skeleton h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
