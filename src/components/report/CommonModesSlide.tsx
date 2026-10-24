"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { FieldDiffHighlight } from "./TeamReport";
import { PokemonSprite } from "./PokemonSprite";
import { PokemonDropdown } from "./PokemonDropdown";
import { Button } from "@/components/ui/Button";

/**
 * A single "bring" combination: two leads + two in the back, chosen from the
 * team's own six (stored as roster indices, matching the Match-Ups game-plan
 * `bring` convention), plus a free-text strategy note.
 */
export interface TeamCombination {
  id: string;
  /** Roster indices of the lead Pokemon (max 2). */
  leads: number[];
  /** Roster indices of the back Pokemon (max 2). */
  back: number[];
  strategy: string;
}

/** The creator-authored "how to pilot this team" object. All keys optional. */
export interface CommonModesValue {
  /** Structured bring combinations (replaces the old free-text leads/modes). */
  combinations?: TeamCombination[];
  strengths?: string;
  weaknesses?: string;
  gameplan?: string;
  /**
   * Legacy free-text fields retained for backward compatibility. 119 shared
   * reports authored before the Combinations table shipped still carry these;
   * we never drop them — they round-trip through serialization and are surfaced
   * read-only (and in a collapsible "Legacy notes" area while editing).
   */
  leads?: string;
  modes?: string;
}

interface CommonModesSlideProps {
  commonModes: CommonModesValue | undefined;
  onChange: (value: CommonModesValue) => void;
  /** The team's own six — the roster the combination picker chooses from. */
  yourPokemon: AnalyzedPokemon[];
  isReadOnly: boolean;
  isPresentationMode?: boolean;
}

/**
 * Accent flavor per block — Strengths reads emerald, Weaknesses reads
 * amber/rose, the rest use the neutral accent. Kept subtle so the section
 * stays consistent with the surface/border palette used across the report.
 */
type Accent = "accent" | "emerald" | "amber";

interface BlockDef {
  key: "strengths" | "weaknesses" | "gameplan";
  /** i18n key for the label */
  labelKey: string;
  /** i18n key for the textarea placeholder */
  placeholderKey: string;
  accent: Accent;
}

// The free-text blocks that remain after leads/modes were collapsed into the
// Combinations table. strengths / weaknesses / gameplan are unchanged.
const BLOCKS: BlockDef[] = [
  { key: "strengths", labelKey: "strengths", placeholderKey: "strengthsPlaceholder", accent: "emerald" },
  { key: "weaknesses", labelKey: "weaknesses", placeholderKey: "weaknessesPlaceholder", accent: "amber" },
  { key: "gameplan", labelKey: "gameplan", placeholderKey: "gameplanPlaceholder", accent: "accent" },
];

/** Left-border accent color for the read-only panels, per block flavor. */
const READ_BORDER: Record<Accent, string> = {
  accent: "border-l-accent/30",
  emerald: "border-l-emerald-500/40",
  amber: "border-l-amber-500/40",
};

/** Label color for the read-only panels, per block flavor. */
const LABEL_COLOR: Record<Accent, string> = {
  accent: "text-text-tertiary",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
};

/** Convert a combination's leads/back arrays into a fixed 4-slot bring tuple. */
function bringOf(c: TeamCombination): [number | null, number | null, number | null, number | null] {
  return [c.leads[0] ?? null, c.leads[1] ?? null, c.back[0] ?? null, c.back[1] ?? null];
}

export function CommonModesSlide({
  commonModes,
  onChange,
  yourPokemon,
  isReadOnly,
  isPresentationMode,
}: CommonModesSlideProps) {
  const { t } = useTranslation();

  // The Integrate phase adds the commonModes i18n keys to every translation
  // file. Until then `t` (a closed TranslationKeys type derived from `en`)
  // doesn't statically know every key across all locales, so read them through
  // an index helper with a graceful fallback — English always supplies a value.
  const tr = (key: string, fallback: string): string => {
    const dict = t as unknown as Record<string, string | undefined>;
    return dict[key] ?? fallback;
  };

  const value = commonModes ?? {};
  const combinations = value.combinations ?? [];

  // Disambiguate duplicate species with a "(2)" suffix, mirroring MatchupPlanSlide.
  const speciesLabels = useMemo(() => {
    const totals: Record<string, number> = {};
    yourPokemon.forEach((mon) => {
      totals[mon.parsed.species] = (totals[mon.parsed.species] ?? 0) + 1;
    });
    const counts: Record<string, number> = {};
    return yourPokemon.map((mon) => {
      const s = mon.parsed.species;
      if (totals[s] <= 1) return s;
      counts[s] = (counts[s] ?? 0) + 1;
      return `${s} (${counts[s]})`;
    });
  }, [yourPokemon]);

  const setKey = (key: "strengths" | "weaknesses" | "gameplan", text: string) => {
    onChange({ ...value, [key]: text });
  };

  const setCombinations = (next: TeamCombination[]) => {
    onChange({ ...value, combinations: next });
  };

  const addCombination = () => {
    setCombinations([
      ...combinations,
      { id: crypto.randomUUID(), leads: [], back: [], strategy: "" },
    ]);
  };

  const removeCombination = (id: string) => {
    setCombinations(combinations.filter((c) => c.id !== id));
  };

  const updateStrategy = (id: string, strategy: string) => {
    setCombinations(combinations.map((c) => (c.id === id ? { ...c, strategy } : c)));
  };

  // Set one of the 4 bring slots (0,1 = leads; 2,3 = back) for a combination.
  const setSlot = (id: string, slot: 0 | 1 | 2 | 3, pokemonIndex: number | null) => {
    setCombinations(
      combinations.map((c) => {
        if (c.id !== id) return c;
        const bring = bringOf(c);
        bring[slot] = pokemonIndex;
        // Compact out nulls — leads/back store up to 2 indices, no gaps.
        const leads = [bring[0], bring[1]].filter((x): x is number => x !== null);
        const back = [bring[2], bring[3]].filter((x): x is number => x !== null);
        return { ...c, leads, back };
      }),
    );
  };

  const hasLegacy = (value.leads ?? "").trim().length > 0 || (value.modes ?? "").trim().length > 0;
  const hasBlocks = BLOCKS.some((b) => (value[b.key] ?? "").trim().length > 0);
  const hasAny = combinations.length > 0 || hasBlocks || hasLegacy;

  return (
    <FieldDiffHighlight field="commonModes" label="How to play changed">
      <div
        className={`flex flex-col gap-3 sm:gap-6 animate-fade-in ${
          isPresentationMode ? "presenting:gap-8" : ""
        }`}
      >
        {/* Section header */}
        <div className="flex flex-col gap-2.5 sm:gap-4">
          <h3
            className="text-[10px] sm:text-sm font-extrabold uppercase tracking-widest text-text-tertiary mb-1 sm:mb-3 presenting:text-base presenting:mb-4"
            data-walkthrough="common-modes"
          >
            {tr("commonModesTitle", "How to Pilot This Team")}
          </h3>

          {isReadOnly && !hasAny ? (
            <div className="w-full p-5 sm:p-6 bg-surface-alt/50 border border-border-subtle rounded-xl text-base text-text-tertiary italic font-medium presenting:text-lg presenting:p-8">
              {tr("commonModesEmpty", "No piloting notes yet.")}
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* ── Common Combinations ─────────────────────────────── */}
              <CombinationsSection
                combinations={combinations}
                yourPokemon={yourPokemon}
                speciesLabels={speciesLabels}
                isReadOnly={isReadOnly}
                isPresentationMode={isPresentationMode}
                tr={tr}
                onAdd={addCombination}
                onRemove={removeCombination}
                onSetSlot={setSlot}
                onStrategyChange={updateStrategy}
              />

              {/* ── Free-text blocks (strengths / weaknesses / gameplan) ─ */}
              {BLOCKS.map((block) => {
                const label = tr(block.labelKey, block.key);
                const text = value[block.key] ?? "";

                // Read-only: skip empty blocks entirely
                if (isReadOnly && !text.trim()) return null;

                return (
                  <div key={block.key} className="flex flex-col gap-1.5 sm:gap-2">
                    <h4
                      className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-widest presenting:text-sm ${
                        isReadOnly ? LABEL_COLOR[block.accent] : "text-text-tertiary"
                      }`}
                    >
                      {label}
                    </h4>

                    {isReadOnly ? (
                      <div
                        className={`w-full p-3 sm:p-5 bg-surface border border-border border-l-[3px] ${READ_BORDER[block.accent]} rounded-xl text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed shadow-sm presenting:text-lg presenting:leading-8 presenting:p-7 presenting:bg-surface-alt presenting:border-border-subtle presenting:tracking-wide`}
                      >
                        {text}
                      </div>
                    ) : (
                      <textarea
                        value={text}
                        onChange={(e) => setKey(block.key, e.target.value)}
                        placeholder={tr(block.placeholderKey, "")}
                        aria-label={label}
                        className="w-full min-h-[3.5rem] sm:min-h-[5rem] p-3 sm:p-4 bg-surface border-2 border-border rounded-xl text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
                        spellCheck={false}
                      />
                    )}
                  </div>
                );
              })}

              {/* ── Legacy leads/modes notes (backward compatibility) ── */}
              <LegacyNotes
                leads={value.leads}
                modes={value.modes}
                isReadOnly={isReadOnly}
                tr={tr}
              />
            </div>
          )}
        </div>
      </div>
    </FieldDiffHighlight>
  );
}

// ── Combinations section ────────────────────────────────────────────────

interface CombinationsSectionProps {
  combinations: TeamCombination[];
  yourPokemon: AnalyzedPokemon[];
  speciesLabels: string[];
  isReadOnly: boolean;
  isPresentationMode?: boolean;
  tr: (key: string, fallback: string) => string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onSetSlot: (id: string, slot: 0 | 1 | 2 | 3, pokemonIndex: number | null) => void;
  onStrategyChange: (id: string, strategy: string) => void;
}

function CombinationsSection({
  combinations,
  yourPokemon,
  speciesLabels,
  isReadOnly,
  isPresentationMode,
  tr,
  onAdd,
  onRemove,
  onSetSlot,
  onStrategyChange,
}: CombinationsSectionProps) {
  const title = tr("commonCombinationsTitle", "Common Combinations");

  // Read-only with no combinations: render nothing (other blocks may still show).
  if (isReadOnly && combinations.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest presenting:text-sm text-text-tertiary">
          {title}
        </h4>
        {!isReadOnly && (
          <Button variant="ghost" size="sm" onClick={onAdd} className="text-accent">
            + {tr("addCombination", "Add combination")}
          </Button>
        )}
      </div>

      {isReadOnly ? (
        <CombinationsTable
          combinations={combinations}
          yourPokemon={yourPokemon}
          speciesLabels={speciesLabels}
          isPresentationMode={isPresentationMode}
          tr={tr}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {combinations.length === 0 && (
            <div className="w-full p-4 sm:p-5 bg-surface-alt/50 border border-dashed border-border rounded-xl text-sm text-text-tertiary italic">
              {tr("commonCombinationsDesc", "Your go-to brings — pick two leads and two in the back from your six, then note when to bring it.")}
            </div>
          )}
          {combinations.map((combo, i) => (
            <CombinationEditor
              key={combo.id}
              combo={combo}
              index={i}
              yourPokemon={yourPokemon}
              speciesLabels={speciesLabels}
              tr={tr}
              onRemove={() => onRemove(combo.id)}
              onSetSlot={(slot, idx) => onSetSlot(combo.id, slot, idx)}
              onStrategyChange={(s) => onStrategyChange(combo.id, s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Read-only combinations table (Leads | Back | Strategy) ──────────────

interface CombinationsTableProps {
  combinations: TeamCombination[];
  yourPokemon: AnalyzedPokemon[];
  speciesLabels: string[];
  isPresentationMode?: boolean;
  tr: (key: string, fallback: string) => string;
}

function SpriteGroup({
  indices,
  yourPokemon,
  speciesLabels,
  size,
}: {
  indices: number[];
  yourPokemon: AnalyzedPokemon[];
  speciesLabels: string[];
  size: number;
}) {
  const valid = indices.filter((idx) => yourPokemon[idx]);
  if (valid.length === 0) {
    return <span className="text-xs text-text-tertiary italic">—</span>;
  }
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      {valid.map((idx, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 w-[52px] sm:w-[60px]">
          <PokemonSprite species={yourPokemon[idx].parsed.species} size={size} />
          <span className="text-[10px] sm:text-xs text-text-secondary truncate w-full text-center leading-tight">
            {speciesLabels[idx] ?? yourPokemon[idx].parsed.species}
          </span>
        </div>
      ))}
    </div>
  );
}

function CombinationsTable({
  combinations,
  yourPokemon,
  speciesLabels,
  isPresentationMode,
  tr,
}: CombinationsTableProps) {
  const spriteSize = isPresentationMode ? 48 : 40;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-sm presenting:bg-surface-alt presenting:border-border-subtle">
      {/* Header row — hidden on mobile, shown sm+ */}
      <div className="hidden sm:grid sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-4 py-2.5 border-b border-border-subtle bg-surface-alt/60 presenting:text-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">#</span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500 dark:text-blue-400">
          {tr("combinationLeads", "Leads")}
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400">
          {tr("combinationBack", "Back")}
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">
          {tr("combinationStrategy", "Strategy")}
        </span>
      </div>

      <div className="divide-y divide-border-subtle">
        {combinations.map((combo, i) => (
          <div
            key={combo.id}
            className="flex flex-col gap-2.5 p-3 sm:grid sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] sm:gap-3 sm:items-center sm:px-4 sm:py-3.5"
          >
            {/* Number */}
            <div className="flex items-center gap-2 sm:block">
              <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold border border-accent/20 presenting:w-9 presenting:h-9 presenting:text-base">
                {i + 1}
              </span>
            </div>

            {/* Leads */}
            <div className="flex flex-col gap-1">
              <span className="sm:hidden text-[10px] font-extrabold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                {tr("combinationLeads", "Leads")}
              </span>
              <SpriteGroup
                indices={combo.leads}
                yourPokemon={yourPokemon}
                speciesLabels={speciesLabels}
                size={spriteSize}
              />
            </div>

            {/* Back */}
            <div className="flex flex-col gap-1">
              <span className="sm:hidden text-[10px] font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400">
                {tr("combinationBack", "Back")}
              </span>
              <SpriteGroup
                indices={combo.back}
                yourPokemon={yourPokemon}
                speciesLabels={speciesLabels}
                size={spriteSize}
              />
            </div>

            {/* Strategy */}
            <div className="flex flex-col gap-1">
              <span className="sm:hidden text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">
                {tr("combinationStrategy", "Strategy")}
              </span>
              {combo.strategy.trim() ? (
                <p className="text-sm sm:text-[0.95rem] text-text-primary whitespace-pre-wrap leading-relaxed presenting:text-lg presenting:leading-8">
                  {combo.strategy}
                </p>
              ) : (
                <span className="text-xs text-text-tertiary italic">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Edit-mode combination row ───────────────────────────────────────────

interface CombinationEditorProps {
  combo: TeamCombination;
  index: number;
  yourPokemon: AnalyzedPokemon[];
  speciesLabels: string[];
  tr: (key: string, fallback: string) => string;
  onRemove: () => void;
  onSetSlot: (slot: 0 | 1 | 2 | 3, pokemonIndex: number | null) => void;
  onStrategyChange: (strategy: string) => void;
}

function CombinationEditor({
  combo,
  index,
  yourPokemon,
  speciesLabels,
  tr,
  onRemove,
  onSetSlot,
  onStrategyChange,
}: CombinationEditorProps) {
  const bring = bringOf(combo);

  return (
    <div className="bg-surface border border-border rounded-2xl border-l-[3px] border-l-accent/40 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold border border-accent/20">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-text-primary">
            {tr("combinationLabel", "Combination")} {index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${tr("removeCombination", "Remove combination")} ${index + 1}`}
          className="text-text-tertiary hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors"
        >
          {tr("removeCombination", "Remove")}
        </button>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 flex flex-col gap-4">
        {/* Lead / Back pickers */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Lead */}
          <div className="flex-1 bg-surface-alt/50 rounded-xl p-3 sm:p-4 border border-border-subtle">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500/20 text-blue-400">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /></svg>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                {tr("combinationLeads", "Leads")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 justify-items-center">
              {([0, 1] as const).map((slot) => (
                <PokemonDropdown
                  key={slot}
                  yourPokemon={yourPokemon}
                  selectedIndex={bring[slot]}
                  onChange={(idx) => onSetSlot(slot, idx)}
                  isReadOnly={false}
                  takenIndices={bring.filter((_, i) => i !== slot)}
                  speciesLabels={speciesLabels}
                />
              ))}
            </div>
          </div>

          {/* Back */}
          <div className="flex-1 bg-surface-alt/50 rounded-xl p-3 sm:p-4 border border-border-subtle">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-500/20 text-amber-400">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {tr("combinationBack", "Back")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 justify-items-center">
              {([2, 3] as const).map((slot) => (
                <PokemonDropdown
                  key={slot}
                  yourPokemon={yourPokemon}
                  selectedIndex={bring[slot]}
                  onChange={(idx) => onSetSlot(slot, idx)}
                  isReadOnly={false}
                  takenIndices={bring.filter((_, i) => i !== slot)}
                  speciesLabels={speciesLabels}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Strategy */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-text-tertiary">
            {tr("combinationStrategy", "Strategy")}
          </span>
          <textarea
            value={combo.strategy}
            onChange={(e) => onStrategyChange(e.target.value)}
            placeholder={tr("combinationStrategyPlaceholder", "When to bring this combo and how to play it out.")}
            aria-label={`${tr("combinationLabel", "Combination")} ${index + 1} ${tr("combinationStrategy", "Strategy")}`}
            className="w-full min-h-[3.5rem] sm:min-h-[4.5rem] p-3 sm:p-4 bg-surface border-2 border-border rounded-xl text-sm sm:text-base text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ── Legacy notes (backward compat for old leads/modes strings) ──────────

interface LegacyNotesProps {
  leads?: string;
  modes?: string;
  isReadOnly: boolean;
  tr: (key: string, fallback: string) => string;
}

function LegacyNotes({ leads, modes, isReadOnly, tr }: LegacyNotesProps) {
  const hasLeads = (leads ?? "").trim().length > 0;
  const hasModes = (modes ?? "").trim().length > 0;
  if (!hasLeads && !hasModes) return null;

  const title = tr("legacyNotesTitle", "Legacy notes");

  const rows = (
    <div className="flex flex-col gap-2.5">
      {hasLeads && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">
            {tr("legacyLeadsLabel", "Common Leads (old)")}
          </span>
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{leads}</p>
        </div>
      )}
      {hasModes && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">
            {tr("legacyModesLabel", "Common Modes (old)")}
          </span>
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{modes}</p>
        </div>
      )}
    </div>
  );

  // Read-only viewers see the legacy text plainly (old reports lose nothing).
  if (isReadOnly) {
    return (
      <div className="w-full p-3 sm:p-4 bg-surface-alt/40 border border-border-subtle rounded-xl">
        <h4 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-2">
          {title}
        </h4>
        {rows}
      </div>
    );
  }

  // Editing: surface in a collapsible <details> so the author can migrate the
  // text into combinations, but we never auto-delete it.
  return (
    <details className="w-full bg-surface-alt/40 border border-border-subtle rounded-xl px-3 py-2 sm:px-4 sm:py-3">
      <summary className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-text-tertiary cursor-pointer select-none">
        {title}
      </summary>
      <div className="mt-3">{rows}</div>
    </details>
  );
}
