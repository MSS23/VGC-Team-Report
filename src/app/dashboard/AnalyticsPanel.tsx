import { DashboardSprite } from "./DashboardSprite";
import type { AnalyticsData } from "./dashboard-types";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
      <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{label}</p>
      <p className="text-lg sm:text-2xl font-extrabold text-text-primary mt-0.5 sm:mt-1">{value}</p>
      {sub && <p className="text-[10px] text-text-secondary mt-0.5 leading-tight">{sub}</p>}
    </div>
  );
}

export function AnalyticsPanel({ data }: { data: AnalyticsData }) {
  const { overview, topByViews, monthlyActivity, topReactions, engagement } = data;
  const maxMonthCount = Math.max(...monthlyActivity.map((m) => m.count), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="Total Views" value={overview.totalViews.toLocaleString()} />
        <StatCard label="Reports" value={overview.totalReports} sub={`${overview.publicReports} public / ${overview.privateReports} private`} />
        <StatCard label="Reactions" value={overview.totalReactions} sub={`on ${engagement.reportsWithReactions} report${engagement.reportsWithReactions !== 1 ? "s" : ""}`} />
        <StatCard label="Comments" value={overview.totalComments} sub={`on ${engagement.reportsWithComments} report${engagement.reportsWithComments !== 1 ? "s" : ""}`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="Saves" value={overview.totalSaves} sub={`${engagement.reportsSaved} report${engagement.reportsSaved !== 1 ? "s" : ""} saved`} />
        <StatCard label="Followers" value={overview.followers} />
      </div>

      {/* Monthly activity chart */}
      {monthlyActivity.length > 0 && (
        <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 sm:mb-3">Reports Created (Last 6 Months)</p>
          <div className="flex items-end gap-2 h-24">
            {monthlyActivity.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-accent/20 rounded-t-md relative"
                  style={{ height: `${Math.max((m.count / maxMonthCount) * 100, 4)}%` }}
                >
                  <div
                    className="absolute inset-0 bg-accent rounded-t-md"
                    style={{ height: `${(m.count / maxMonthCount) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-tertiary font-bold">
                  {new Date(m.month + "-01").toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top reports by views */}
      {topByViews.length > 0 && (
        <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 sm:mb-3">Top Reports by Views</p>
          <div className="space-y-1 sm:space-y-2">
            {topByViews.map((report, i) => (
              <a
                key={report.id}
                href={`/s/${report.id}`}
                className="flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-surface-alt/50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-[10px] sm:text-xs font-extrabold text-text-tertiary w-4 sm:w-5 flex-shrink-0">{i + 1}</span>
                  <div className="hidden sm:flex items-center gap-0.5">
                    {report.species.slice(0, 3).map((s, j) => (
                      <DashboardSprite key={j} species={s} />
                    ))}
                    {report.species.length > 3 && <span className="text-[10px] text-text-tertiary ml-1">+{report.species.length - 3}</span>}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-text-primary truncate">
                    {report.tournamentName || report.species.join(" / ")}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-extrabold text-text-secondary whitespace-nowrap flex-shrink-0">
                  {report.viewCount.toLocaleString()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Top reactions */}
      {topReactions.length > 0 && (
        <div className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 sm:mb-3">Top Reactions</p>
          <div className="flex flex-wrap gap-3">
            {topReactions.map((r) => (
              <div key={r.type} className="flex items-center gap-1.5 bg-surface-alt/50 px-3 py-1.5 rounded-lg">
                <span className="text-base">{r.type}</span>
                <span className="text-xs font-extrabold text-text-secondary">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
