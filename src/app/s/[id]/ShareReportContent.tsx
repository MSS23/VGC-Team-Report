/**
 * Server-rendered view of a shared report (VGC-275 / VGC-228).
 *
 * This is a plain server component: no hooks, no client JS. It exists so the
 * initial HTML response for `/s/[id]` actually contains the team — species,
 * spreads, moves, the creator's notes and matchup plans — instead of a spinner
 * that waits on a browser-side fetch a crawler is not allowed to make.
 *
 * It is deliberately a static, read-only rendering rather than a second
 * implementation of the report UI: the interactive slideshow still comes from
 * the client app, which takes over on hydration. Anything here has already
 * passed the visibility + redaction gate in `getShareForRender`.
 */

import Link from "next/link";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { convertToChampionsSp } from "@/lib/analysis/stat-calculator";
import { isChampionsFormat } from "@/lib/data/tags";
import type { StatSpread } from "@/lib/types/pokemon";
import type { RenderableShare } from "@/lib/sharing/get-share-for-render";

const STAT_LABELS: Array<[keyof StatSpread, string]> = [
  ["hp", "HP"],
  ["atk", "Atk"],
  ["def", "Def"],
  ["spa", "SpA"],
  ["spd", "SpD"],
  ["spe", "Spe"],
];

function spreadToText(spread: StatSpread): string {
  const parts = STAT_LABELS.filter(([stat]) => spread[stat] > 0).map(
    ([stat, label]) => `${spread[stat]} ${label}`,
  );
  return parts.join(" / ");
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Species keys mirror useHomePage: duplicates get a `-2`, `-3`, … suffix. */
function buildSpeciesKeys(speciesList: string[]): string[] {
  const counts: Record<string, number> = {};
  return speciesList.map((species) => {
    counts[species] = (counts[species] ?? 0) + 1;
    return counts[species] > 1 ? `${species}-${counts[species]}` : species;
  });
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block, i) => (
          <p key={i} className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
            {block}
          </p>
        ))}
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-alt px-2.5 py-1 text-xs font-semibold text-text-secondary">
      {children}
    </span>
  );
}

export function ShareReportContent({ share }: { share: RenderableShare }) {
  const data = share.data;

  const paste = str(data.paste);
  const team = parseShowdownPaste(paste);
  const speciesList = team.pokemon.map((mon) => mon.species);
  const speciesKeys = buildSpeciesKeys(speciesList);

  const teamName = str(data.teamName);
  const tournamentName = str(data.tournamentName);
  const placement = str(data.placement);
  const teamRecord = str(data.record);
  const creatorName = str(data.creatorName);
  const teamSummary = str(data.teamSummary);
  const rentalCode = str(data.rentalCode);

  const tags = record(data.tags);
  const regulation = str(tags.regulation);
  const eventType = str(tags.eventType);
  const archetypes = Array.isArray(tags.archetype)
    ? (tags.archetype as unknown[]).map(str).filter(Boolean)
    : [];

  const champions = isChampionsFormat(regulation);
  const spreadLabel = champions ? "SP" : "EVs";

  // A redacted nature line is *removed* from the paste, and the parser then
  // falls back to "Serious" — so rendering it would invent a spread the
  // creator deliberately hid. Item/EVs/IVs need no such guard: they parse to
  // null / zeros / unused and drop out of the markup on their own.
  const natureHidden = share.redactedFields.includes("nature");

  const notes = record(data.notes);
  const roles = record(data.roles);
  const calcs = record(data.calcs);
  const commonModes = record(data.commonModes);
  const hiddenSlides = new Set(
    Array.isArray(data.hiddenSlides) ? (data.hiddenSlides as unknown[]).map(str) : [],
  );

  const heading =
    teamName ||
    tournamentName ||
    (speciesList.length > 0 ? speciesList.join(" / ") : "VGC Team Report");

  const byline = [creatorName, ...share.collaborators].filter(Boolean);

  const plans = (Array.isArray(data.matchupPlans) ? data.matchupPlans : [])
    .map(record)
    .filter((plan) => plan.showSlide !== false);

  const modeText = [
    ["Leads", str(commonModes.leads)],
    ["Common modes", str(commonModes.modes)],
    ["Strengths", str(commonModes.strengths)],
    ["Weaknesses", str(commonModes.weaknesses)],
    ["Game plan", str(commonModes.gameplan)],
  ].filter(([, value]) => value) as Array<[string, string]>;
  const showModes = !hiddenSlides.has("common-modes") && modeText.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-3xl">
            {heading}
          </h1>
          {(tournamentName && tournamentName !== heading) || byline.length > 0 ? (
            <p className="mt-2 text-sm text-text-secondary">
              {tournamentName && tournamentName !== heading ? tournamentName : null}
              {tournamentName && tournamentName !== heading && byline.length > 0 ? " · " : null}
              {byline.length > 0 ? `by ${byline.join(", ")}` : null}
            </p>
          ) : null}

          {(placement || teamRecord || regulation || eventType || archetypes.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {placement && <Chip>{placement}</Chip>}
              {teamRecord && <Chip>{teamRecord}</Chip>}
              {regulation && <Chip>{regulation}</Chip>}
              {eventType && <Chip>{eventType}</Chip>}
              {archetypes.map((archetype) => (
                <Chip key={archetype}>{archetype}</Chip>
              ))}
            </div>
          )}
        </header>

        {teamSummary && (
          <section className="mb-8">
            <h2 className="mb-2 text-lg font-bold text-text-primary">Team overview</h2>
            <div className="space-y-3">
              <Paragraphs text={teamSummary} />
            </div>
          </section>
        )}

        {team.pokemon.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-text-primary">
              The team{speciesList.length > 0 ? ` — ${speciesList.join(", ")}` : ""}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {team.pokemon.map((mon, i) => {
                const key = speciesKeys[i] ?? mon.species;
                const spread = champions ? convertToChampionsSp(mon.evs) : mon.evs;
                const spreadText = spreadToText(spread);
                const role = str(roles[key]);
                const note = str(notes[key]);
                const monCalcs = Array.isArray(calcs[key])
                  ? (calcs[key] as unknown[]).map((entry) => str(record(entry).text)).filter(Boolean)
                  : [];
                const detailHidden = hiddenSlides.has(key);

                return (
                  <div
                    key={`${key}-${i}`}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <h3 className="text-base font-bold text-text-primary">
                      {mon.species}
                      {mon.item ? (
                        <span className="font-semibold text-text-secondary"> @ {mon.item}</span>
                      ) : null}
                    </h3>
                    {role && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                        {role}
                      </p>
                    )}

                    <dl className="mt-3 space-y-1 text-sm text-text-secondary">
                      {mon.ability && (
                        <div className="flex gap-2">
                          <dt className="font-semibold text-text-primary">Ability</dt>
                          <dd>{mon.ability}</dd>
                        </div>
                      )}
                      {mon.teraType && (
                        <div className="flex gap-2">
                          <dt className="font-semibold text-text-primary">Tera Type</dt>
                          <dd>{mon.teraType}</dd>
                        </div>
                      )}
                      {mon.nature && !natureHidden && (
                        <div className="flex gap-2">
                          <dt className="font-semibold text-text-primary">Nature</dt>
                          <dd>{mon.nature}</dd>
                        </div>
                      )}
                      {spreadText && (
                        <div className="flex gap-2">
                          <dt className="font-semibold text-text-primary">{spreadLabel}</dt>
                          <dd>{spreadText}</dd>
                        </div>
                      )}
                    </dl>

                    {mon.moves.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {mon.moves.map((move, m) => (
                          <li
                            key={`${move}-${m}`}
                            className="rounded-md bg-surface-alt px-2 py-1 text-xs font-medium text-text-secondary"
                          >
                            {move}
                          </li>
                        ))}
                      </ul>
                    )}

                    {!detailHidden && note && (
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        <Paragraphs text={note} />
                      </div>
                    )}

                    {!detailHidden && monCalcs.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-border pt-3">
                        {monCalcs.map((calc, c) => (
                          <li key={c} className="text-xs leading-relaxed text-text-secondary">
                            {calc}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {showModes && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-text-primary">Leads and common modes</h2>
            <div className="space-y-4">
              {modeText.map(([label, value]) => (
                <div key={label}>
                  <h3 className="text-sm font-bold text-text-primary">{label}</h3>
                  <div className="mt-1 space-y-2">
                    <Paragraphs text={value} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {plans.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-text-primary">Matchup plans</h2>
            <div className="space-y-4">
              {plans.map((plan, i) => {
                const label = str(plan.opponentLabel) || `Matchup ${i + 1}`;
                const gamePlans = (Array.isArray(plan.gamePlans) ? plan.gamePlans : [])
                  .map(record)
                  .map((gp) => str(gp.notes))
                  .filter(Boolean);
                return (
                  <div key={i} className="rounded-xl border border-border bg-surface p-4">
                    <h3 className="text-sm font-bold text-text-primary">vs {label}</h3>
                    {gamePlans.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {gamePlans.map((noteText, g) => (
                          <Paragraphs key={g} text={noteText} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {rentalCode && (
          <section className="mb-8">
            <h2 className="mb-1 text-lg font-bold text-text-primary">Rental code</h2>
            <p className="font-mono text-sm text-text-secondary">{rentalCode}</p>
          </section>
        )}

        {share.redactedFields.length > 0 && (
          <p className="mb-8 text-xs text-text-tertiary">
            Some details ({share.redactedFields.join(", ")}) were hidden by the creator.
          </p>
        )}

        {paste && (
          <section className="mb-8">
            <h2 className="mb-2 text-lg font-bold text-text-primary">Showdown export</h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-alt p-4">
              <pre className="text-xs leading-relaxed text-text-secondary">{paste}</pre>
            </div>
          </section>
        )}

        <p className="text-sm text-text-secondary">
          <Link
            href="/"
            className="font-semibold text-accent underline underline-offset-2 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Build your own VGC team report
          </Link>
        </p>
      </article>
    </main>
  );
}
