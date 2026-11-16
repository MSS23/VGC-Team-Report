/**
 * Server-rendered content hero for /s/[id] (VGC-318, first half).
 *
 * `/s/[id]` used to return nothing but a client redirect to `/?s=<id>`, so
 * every sitemapped share URL resolved to a spinner: no crawlable content, and
 * a recipient on a cold mobile connection stared at an empty screen for the
 * length of a bundle download plus a Neon cold start. The share row is already
 * in hand on the server (it is loaded for <head> and JSON-LD), so the cheap fix
 * is to spend it on real markup. Markup approach copied from
 * `src/app/embed/[id]/page.tsx`, which has rendered the same facts server-side
 * for a while; the layout deliberately echoes `loading.tsx` so the sequence
 * skeleton → hero → interactive report reads as progressive loading.
 *
 * PRIVACY: `buildShareHeroProps` returns `null` for anything that is not
 * `is_public = TRUE`, which is the same gate `/embed/[id]` uses. Private and
 * unlisted reports therefore gain no server-rendered content at all. On top of
 * that gate, the paste is passed through `redactPasteFields` before species are
 * extracted, so the creator's hidden items/EVs/IVs/nature can never reach this
 * HTML even indirectly. The hero only ever renders species names, tournament,
 * placement, record, creator, regulation and the creator's own summary — the
 * same fields `generateMetadata` already publishes in <head>.
 */

import { normalizePrivateFields, redactPasteFields } from "@/lib/sharing/redact-paste";
import { extractSpecies } from "@/lib/utils/extract-species";
import { resolveSlug } from "@/lib/utils/sprite-slug";

export type ShareHeroProps = {
  shareId: string;
  heading: string;
  tournamentName: string;
  placement: string;
  record: string;
  creatorName: string;
  collaborators: string[];
  regulation: string;
  summary: string;
  species: string[];
};

/** Matches the ~220-char budget `generateMetadata` uses for og:description. */
const SUMMARY_MAX = 220;

function truncate(text: string, max: number): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Derive the hero's props from a `shares` row, or `null` when nothing may be
 * rendered. The visibility check is repeated here on purpose: this function is
 * the single place that decides whether share content becomes HTML, so it must
 * be safe to call with any row.
 */
export function buildShareHeroProps({
  shareId,
  row,
  collaborators,
  heading,
}: {
  shareId: string;
  row: Record<string, unknown>;
  collaborators: string[];
  heading: string;
}): ShareHeroProps | null {
  // Public only. Unlisted reports stay link-only (and are noindex) — rendering
  // their contents server-side would hand a crawler content the creator chose
  // to keep out of discovery, which is the opposite of the point.
  if (row.is_public !== true) return null;

  const data = (row.data ?? {}) as Record<string, unknown>;

  // Non-owner view, so apply the creator's tiered-publishing redaction before
  // reading anything out of the paste (same contract as /api/share/[id]).
  const privateFields = normalizePrivateFields(data.privateFields as string[] | undefined);
  const paste = redactPasteFields(str(data.paste), privateFields);
  const species = extractSpecies(paste);

  const tags = (data.tags ?? {}) as { regulation?: unknown };

  return {
    shareId,
    heading: heading || "VGC Team Report",
    tournamentName: str(data.tournamentName),
    placement: str(data.placement),
    record: str(data.record),
    creatorName: str(data.creatorName),
    collaborators: collaborators.filter((name) => typeof name === "string" && name.trim() !== ""),
    regulation: str(tags.regulation),
    summary: truncate(str(data.teamSummary), SUMMARY_MAX),
    species,
  };
}

export function ShareHero({
  shareId,
  heading,
  tournamentName,
  placement,
  record,
  creatorName,
  collaborators,
  regulation,
  summary,
  species,
}: ShareHeroProps) {
  const byline: string[] = [];
  if (placement) byline.push(placement);
  if (record) byline.push(record);
  // The heading already carries the tournament name when there is one, so only
  // repeat it in the byline when the heading had to fall back to something else.
  if (tournamentName && tournamentName !== heading) byline.push(tournamentName);
  if (creatorName) {
    byline.push(
      collaborators.length > 0
        ? `by ${creatorName} with ${collaborators.join(", ")}`
        : `by ${creatorName}`,
    );
  }

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary break-words">
                {heading}
              </h1>
              {byline.length > 0 && (
                <p className="text-sm text-text-secondary">{byline.join(" · ")}</p>
              )}
            </div>
            {regulation && (
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-surface-alt border border-border text-xs font-bold tracking-wide text-text-primary">
                {regulation}
              </span>
            )}
          </div>
        </header>

        {species.length > 0 && (
          <div className="mb-6 sm:mb-8 bg-surface-alt/40 border border-border-subtle rounded-xl py-4 px-4">
            <ul
              aria-label="Team members"
              className="flex flex-wrap items-start justify-center gap-4 sm:gap-6 list-none m-0 p-0"
            >
              {species.map((name) => (
                <li key={name} className="flex flex-col items-center gap-1 w-16 sm:w-20">
                  {/* Showdown sprites are served straight from play.pokemonshowdown.com
                      across the app (next/image remotePatterns is empty), and the name
                      is rendered beside it, so the image itself is decorative. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://play.pokemonshowdown.com/sprites/home/${resolveSlug(name)}.png`}
                    alt=""
                    aria-hidden="true"
                    width={80}
                    height={80}
                    loading="eager"
                    className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                  />
                  <span className="text-[11px] sm:text-xs font-bold text-text-secondary text-center break-words">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary && (
          <div className="mb-6 sm:mb-8 bg-surface border border-border rounded-xl px-4 py-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-tertiary mb-2">
              Team summary
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* The client redirect below this hero takes a real visitor to the
              interactive report; this link is the no-JS and crawler path to the
              same place, and the only call to action on the page. */}
          <a
            href={`/?s=${encodeURIComponent(shareId)}`}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide bg-surface text-text-primary border-2 border-border hover:border-accent/40 hover:bg-accent-surface transition-colors duration-200"
          >
            Open the full report
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </a>
          <p role="status" className="flex items-center gap-2 text-sm text-text-secondary">
            <span
              aria-hidden="true"
              className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0"
            />
            Loading damage calcs, speed tiers and matchup plans…
          </p>
        </div>
      </div>
    </main>
  );
}
