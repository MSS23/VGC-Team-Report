"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
// QRCode loaded dynamically — only needed when rental code is present
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { SpriteConfig } from "@/lib/types/sprites";
import { PokemonCard } from "./PokemonCard";
import { TeamStats } from "./TeamStats";
import { useTranslation } from "@/lib/i18n";
import { ARCHETYPES, REGULATIONS, EVENT_TYPES } from "@/lib/data/tags";
import type { ReportTags } from "@/lib/data/tags";
import { FieldDiffHighlight } from "./TeamReport";
import { hapticMedium, hapticSuccess } from "@/lib/utils/haptics";
import { detectImportSource } from "@/lib/utils/multi-import";
import { fetchPokePaste } from "@/lib/utils/pokepaste";
import { validateChampionsTeam, type LegalityResult, type LegalityIssue } from "@/lib/validation/champions-legality";

/** Wraps a card with tap and long-press gestures. Tap navigates instantly on touch; long-press (500ms hold) also navigates + haptic. */
function LongPressWrapper({
  onLongPress,
  onTap,
  children,
  className,
  draggable,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: {
  onLongPress?: () => void;
  onTap?: () => void;
  children: React.ReactNode;
  className?: string;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler;
  onDragEnd?: React.DragEventHandler;
  onDragEnter?: React.DragEventHandler;
  onDragLeave?: React.DragEventHandler;
  onDragOver?: React.DragEventHandler;
  onDrop?: React.DragEventHandler;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);
  const didLongPress = useRef(false);
  const [pressed, setPressed] = useState(false);

  const start = useCallback(() => {
    cancelled.current = false;
    didLongPress.current = false;
    setPressed(true);
    if (!onLongPress) return;
    timer.current = setTimeout(() => {
      if (!cancelled.current) {
        didLongPress.current = true;
        hapticMedium();
        onLongPress();
      }
    }, 500);
  }, [onLongPress]);

  const move = useCallback(() => {
    cancelled.current = true;
    setPressed(false);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const end = useCallback((e: React.TouchEvent) => {
    if (timer.current) clearTimeout(timer.current);
    setPressed(false);
    // Quick tap (not moved, not long-pressed) → navigate
    if (!cancelled.current && !didLongPress.current && onTap) {
      const target = e.target as HTMLElement;
      // Don't navigate if tapping an interactive child element
      if (!target.closest('button, input, textarea, a, [role="button"], [contenteditable]')) {
        onTap();
      }
    }
  }, [onTap]);

  return (
    <div
      className={`${className ?? ""} ${pressed ? "scale-[0.97] opacity-80" : ""} transition-transform duration-100`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onTouchStart={start}
      onTouchEnd={end}
      onTouchMove={move}
      onClick={(e) => {
        // Desktop click fallback — touch devices use onTap above
        if (onTap && !(e.target as HTMLElement).closest('button, input, textarea, a, [role="button"], [contenteditable]')) {
          onTap();
        }
      }}
    >
      {children}
    </div>
  );
}

/** Compact inline panel for re-importing a team from a URL or paste */
function UpdateTeamPanel({ onUpdatePaste }: { onUpdatePaste: (paste: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError("");

    const source = detectImportSource(trimmed);
    if (source === "pokepaste" || source === "pikalytics") {
      setLoading(true);
      try {
        const result = await fetchPokePaste(trimmed);
        if (!result.paste) {
          setError("Could not fetch team from URL");
          setLoading(false);
          return;
        }
        hapticSuccess();
        onUpdatePaste(result.paste);
        setInput("");
        setOpen(false);
      } catch {
        setError("Failed to fetch — check the URL");
      }
      setLoading(false);
    } else if (source === "showdown") {
      hapticSuccess();
      onUpdatePaste(trimmed);
      setInput("");
      setOpen(false);
    } else {
      setError("Paste a Showdown export, PokePaste URL, or Pikalytics URL");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-text-tertiary hover:text-accent border border-border-subtle hover:border-accent/30 rounded-lg transition-all cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
        </svg>
        Update Team
      </button>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 flex flex-col gap-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Update Team</span>
        <button type="button" onClick={() => { setOpen(false); setError(""); }} className="text-text-tertiary hover:text-text-primary text-sm cursor-pointer">&#10005;</button>
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={"Paste a PokePaste URL, Pikalytics URL, or Showdown export...\n\npokepast.es/abc123\npikalytics.com/team/...\nOr paste the full Showdown text"}
        className="w-full min-h-[4rem] sm:min-h-[5rem] p-2.5 bg-surface-alt border border-border-subtle rounded-lg text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary/50 resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 leading-relaxed"
        spellCheck={false}
        autoFocus
      />
      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="px-3 py-1.5 text-xs font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {loading ? "Fetching..." : "Apply"}
        </button>
        <span className="text-[10px] text-text-tertiary">This will replace all Pokemon and reset calcs/notes</span>
      </div>
    </div>
  );
}

// ── Legality Badge ──────────────────────────────────────────────────────────

function LegalityBadge({ result }: { result: LegalityResult }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");
  const infos = result.issues.filter((i) => i.severity === "info");

  if (result.legal && errors.length === 0 && warnings.length === 0) {
    // Legal with only info — show green badge, clickable for details
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors"
        >
          &#10003; Legal
        </button>
        {open && infos.length > 0 && (
          <div className="absolute top-full left-0 mt-1.5 z-50 w-72 rounded-lg border border-border bg-surface shadow-lg p-3 space-y-2">
            {infos.map((issue, i) => (
              <div key={i} className="text-xs flex items-start gap-1.5">
                <span className="text-blue-500 shrink-0 mt-px">&#9432;</span>
                <span className="text-text-secondary">{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Has issues
  const issueCount = errors.length + warnings.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
          errors.length > 0
            ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
        }`}
      >
        {errors.length > 0 ? "\u2716" : "\u26A0"} {issueCount} {issueCount === 1 ? "issue" : "issues"}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-80 rounded-lg border border-border bg-surface shadow-lg p-3 space-y-2 max-h-64 overflow-y-auto">
          {errors.map((issue, i) => (
            <LegalityIssueRow key={`e${i}`} issue={issue} />
          ))}
          {warnings.map((issue, i) => (
            <LegalityIssueRow key={`w${i}`} issue={issue} />
          ))}
          {infos.map((issue, i) => (
            <LegalityIssueRow key={`i${i}`} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

function LegalityIssueRow({ issue }: { issue: LegalityIssue }) {
  const icon = issue.severity === "error" ? "\u2716" : issue.severity === "warning" ? "\u26A0" : "\u2139";
  const color = issue.severity === "error" ? "text-red-500" : issue.severity === "warning" ? "text-amber-500" : "text-blue-500";
  return (
    <div className="text-xs flex items-start gap-1.5">
      <span className={`${color} shrink-0 mt-px`}>{icon}</span>
      <span className="text-text-secondary">{issue.message}</span>
    </div>
  );
}

interface TeamOverviewProps {
  pokemon: AnalyzedPokemon[];
  creatorMode: boolean;
  speciesKeys: string[];
  roles: Record<string, string>;
  onRoleChange: (speciesKey: string, text: string) => void;
  summary: string;
  onSummaryChange: (text: string) => void;
  teamName?: string;
  onTeamNameChange?: (text: string) => void;
  tournamentName?: string;
  onTournamentNameChange?: (text: string) => void;
  placement?: string;
  onPlacementChange?: (text: string) => void;
  record?: string;
  onRecordChange?: (text: string) => void;
  rentalCode?: string;
  onRentalCodeChange?: (text: string) => void;
  creatorName?: string;
  onCreatorNameChange?: (text: string) => void;
  mvpIndex?: number | null;
  onMvpIndexChange?: (index: number | null) => void;
  tags?: ReportTags;
  onTagsChange?: (tags: ReportTags) => void;
  isReadOnly: boolean;
  getSpriteConfig?: (key: string) => SpriteConfig;
  onReorderPokemon?: (fromIndex: number, toIndex: number) => void;
  /** Long-press a Pokemon card to navigate to its detail slide (mobile gesture) */
  onPokemonLongPress?: (index: number) => void;
  /** Re-import a team from a new paste/URL — replaces the entire team */
  onUpdatePaste?: (paste: string) => void;
  megaStates?: Record<number, boolean>;
  onToggleMega?: (index: number) => void;
  /** Global SP/EV display mode, controlled by the parent. */
  showEvMode?: boolean;
  onShowEvModeChange?: (v: boolean) => void;
}

export function TeamOverview({
  pokemon,
  creatorMode,
  speciesKeys,
  roles,
  onRoleChange,
  summary,
  onSummaryChange,
  teamName,
  onTeamNameChange,
  tournamentName,
  onTournamentNameChange,
  placement,
  onPlacementChange,
  record,
  onRecordChange,
  rentalCode,
  onRentalCodeChange,
  creatorName,
  onCreatorNameChange,
  mvpIndex,
  onMvpIndexChange,
  tags,
  onTagsChange,
  isReadOnly,
  getSpriteConfig,
  onReorderPokemon,
  onPokemonLongPress,
  onUpdatePaste,
  megaStates,
  onToggleMega,
  showEvMode,
  onShowEvModeChange,
}: TeamOverviewProps) {
  const { t } = useTranslation();
  const hasTournamentInfo = !!(teamName || tournamentName || placement || record);
  const hasCreatorInfo = !!creatorName;

  // Champions legality validation — only runs when regulation is Reg M-A
  const legality = useMemo(() => {
    if (tags?.regulation !== "Reg M-A") return null;
    return validateChampionsTeam(pokemon.map((p) => p.parsed));
  }, [tags?.regulation, pokemon]);
  const [rentalCopied, setRentalCopied] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);
  const canDrag = !isReadOnly && !!onReorderPokemon;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!rentalCode) { setQrDataUrl(null); return; }
    import("qrcode").then(QRCode =>
      QRCode.default.toDataURL(rentalCode, { width: 80, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null))
    ).catch(() => setQrDataUrl(null));
  }, [rentalCode]);

  const copyRentalCode = () => {
    if (!rentalCode) return;
    navigator.clipboard.writeText(rentalCode);
    setRentalCopied(true);
    setTimeout(() => setRentalCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-6 animate-fade-in">
      {/* Tournament Context */}
      {isReadOnly ? (
        (hasTournamentInfo || rentalCode || hasCreatorInfo) && (
          <FieldDiffHighlight field={["teamName", "tournamentName", "placement", "record", "rentalCode", "creatorName", "tags"]} label="Info changed">
          <div className="flex flex-col gap-2 px-1">
            {teamName && (
              <h1 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight leading-tight presenting:text-5xl">
                {teamName}
              </h1>
            )}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {tournamentName && (
                <h2 className={`font-extrabold text-text-primary tracking-tight leading-tight ${teamName ? "text-base sm:text-lg text-text-secondary" : "text-xl sm:text-3xl"}`}>
                  {tournamentName}
                </h2>
              )}
              {placement && (
                <span className="text-sm font-extrabold text-accent bg-accent-surface px-3.5 py-1.5 rounded-lg border border-accent/20 tracking-wide shadow-sm shadow-accent/10">
                  {placement}
                </span>
              )}
              {record && (
                <span className="text-sm text-text-secondary font-semibold">({record})</span>
              )}
            </div>
            {rentalCode && (
              <div className="flex items-center gap-3 self-start">
                <button
                  onClick={copyRentalCode}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface border-2 border-border rounded-lg hover:bg-surface-alt hover:border-accent/30 transition-all"
                  title={t.copyRentalCode}
                >
                  <span className="text-sm font-[family-name:var(--font-mono)] font-extrabold text-text-primary tracking-widest">
                    {rentalCode}
                  </span>
                  <span className={`text-xs font-semibold transition-colors duration-200 ${rentalCopied ? "text-emerald-500" : "text-text-tertiary"}`}>
                    {rentalCopied ? "\u2713 " + t.copied : t.copy}
                  </span>
                </button>
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for rental code ${rentalCode}`}
                    width={64}
                    height={64}
                    className="rounded-lg border border-border shadow-sm"
                  />
                )}
              </div>
            )}
            {creatorName && (
              <p className="text-sm text-text-secondary font-medium">
                {t.by} <span className="text-text-primary font-bold">{creatorName}</span>
              </p>
            )}
            {(tags && (tags.archetype?.length || tags.regulation || tags.eventType)) || legality ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {tags?.regulation && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {tags.regulation}
                  </span>
                )}
                {legality && <LegalityBadge result={legality} />}
                {tags?.eventType && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {tags.eventType}
                  </span>
                )}
                {tags?.archetype?.map((a) => (
                  <span key={a} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                    {a}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          </FieldDiffHighlight>
        )
      ) : (
        <FieldDiffHighlight field={["teamName", "tournamentName", "placement", "record", "rentalCode", "creatorName", "tags"]} label="Info changed">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-3" data-walkthrough="tournament-info">
            {t.tournamentInfo}
          </h3>
          <div className="mb-2">
            <input
              type="text"
              value={teamName ?? ""}
              onChange={(e) => onTeamNameChange?.(e.target.value)}
              placeholder={t.teamNamePlaceholder}
              maxLength={80}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-surface border-2 border-border rounded-lg text-base sm:text-lg font-extrabold text-text-primary placeholder:text-text-tertiary placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow tracking-tight"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <input
              type="text"
              value={tournamentName ?? ""}
              onChange={(e) => onTournamentNameChange?.(e.target.value)}
              placeholder={t.eventNamePlaceholder}
              className="w-full sm:flex-1 sm:min-w-[180px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:flex sm:gap-3 sm:w-auto">
              <input
                type="text"
                value={placement ?? ""}
                onChange={(e) => onPlacementChange?.(e.target.value)}
                placeholder={t.placementPlaceholder}
                className="w-full sm:w-[140px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              />
              <input
                type="text"
                value={record ?? ""}
                onChange={(e) => onRecordChange?.(e.target.value)}
                placeholder={t.recordPlaceholder}
                className="w-full sm:w-[120px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              />
              <input
                type="text"
                value={rentalCode ?? ""}
                onChange={(e) => onRentalCodeChange?.(e.target.value.toUpperCase())}
                placeholder={t.rentalPlaceholder}
                maxLength={20}
                className="w-full sm:flex-none sm:w-[160px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm font-[family-name:var(--font-mono)] font-bold text-text-primary placeholder:text-text-tertiary placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow tracking-widest"
              />
            </div>
            <input
              type="text"
              value={creatorName ?? ""}
              onChange={(e) => onCreatorNameChange?.(e.target.value)}
              placeholder={t.creatorNamePlaceholder}
              className="w-full sm:flex-1 sm:min-w-[200px] px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border-2 border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
          </div>
          <p className="text-[10px] text-text-tertiary mt-1.5 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Optional — but filling these in helps your report appear in search results on the Explore page.
          </p>

          {/* Tags */}
          <div className="mt-3 flex flex-col gap-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">Tags</h4>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <select
                value={tags?.regulation ?? ""}
                onChange={(e) => onTagsChange?.({ ...(tags ?? {}), regulation: e.target.value || undefined })}
                className="w-full sm:w-[140px] px-3 py-2 bg-surface border-2 border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              >
                <option value="">Regulation</option>
                {REGULATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={tags?.eventType ?? ""}
                onChange={(e) => onTagsChange?.({ ...(tags ?? {}), eventType: e.target.value || undefined })}
                className="w-full sm:w-[160px] px-3 py-2 bg-surface border-2 border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
              >
                <option value="">Event Type</option>
                {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ARCHETYPES.map((a) => {
                const active = tags?.archetype?.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      const current = tags?.archetype ?? [];
                      const next = active ? current.filter((x) => x !== a) : [...current, a];
                      onTagsChange?.({ ...(tags ?? {}), archetype: next.length > 0 ? next : undefined });
                    }}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-all ${
                      active
                        ? "bg-accent text-white border-accent shadow-sm shadow-accent/20"
                        : "bg-surface-alt/50 text-text-secondary border-border hover:border-accent/30 hover:text-accent"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </FieldDiffHighlight>
      )}

      {/* Team Summary */}
      <FieldDiffHighlight field="teamSummary" label="Summary changed">
      <div>
        <h3 className="text-[10px] sm:text-sm font-extrabold uppercase tracking-widest text-text-tertiary mb-1 sm:mb-3 presenting:text-base presenting:mb-4" data-walkthrough="team-summary">
          {t.teamSummary}
        </h3>
        {isReadOnly ? (
          summary ? (
            <div className="relative">
              <div
                className={`w-full p-3 sm:p-6 bg-surface border border-border border-l-[3px] border-l-accent/30 rounded-xl text-sm sm:text-lg text-text-primary whitespace-pre-wrap leading-relaxed shadow-sm presenting:text-xl presenting:leading-9 presenting:p-8 presenting:bg-surface-alt presenting:border-border-subtle presenting:tracking-wide ${
                  !summaryExpanded && summary.length > 200 ? "sm:min-h-[8rem] max-h-24 sm:max-h-none overflow-hidden" : "sm:min-h-[8rem]"
                }`}
              >
                {summary}
              </div>
              {/* Show more/less toggle — mobile only, for long summaries */}
              {summary.length > 200 && (
                <button
                  type="button"
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className={`sm:hidden w-full text-center py-2 text-xs font-bold text-accent active:scale-[0.97] transition-all ${
                    !summaryExpanded ? "-mt-8 relative z-10 bg-gradient-to-t from-surface via-surface/95 to-transparent pt-6 rounded-b-xl border-x border-b border-border" : "mt-1"
                  }`}
                >
                  {summaryExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          ) : (
            <div className="w-full p-5 sm:p-6 bg-surface-alt/50 border border-border-subtle rounded-xl text-base text-text-tertiary italic font-medium presenting:text-lg presenting:p-8">
              {t.noTeamSummary}
            </div>
          )
        ) : (
          <textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder={t.teamSummaryPlaceholder}
            className="w-full min-h-[4rem] sm:min-h-[8rem] p-3 sm:p-6 bg-surface border-2 border-border rounded-xl text-sm sm:text-lg text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
            spellCheck={false}
          />
        )}
      </div>
      </FieldDiffHighlight>

      {/* Team Stats Summary */}
      <div className="mb-1 sm:mb-4">
        <TeamStats pokemon={pokemon} />
      </div>

      {/* Update Team (creator mode only) */}
      {creatorMode && !isReadOnly && onUpdatePaste && (
        <UpdateTeamPanel onUpdatePaste={onUpdatePaste} />
      )}

      {/* Pokemon Grid */}
      <div data-walkthrough="pokemon-grid" className={`stagger-children grid gap-2.5 sm:gap-5 creator:gap-6 ${
        creatorMode
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
      }`}>
        {pokemon.map((mon, i) => {
          const sc = getSpriteConfig?.(speciesKeys[i]);
          const isDragging = dragIndex === i;
          const isDragOver = dragOverIndex === i && dragIndex !== i;
          return (
            <LongPressWrapper
              key={`${mon.parsed.species}-${i}`}
              onLongPress={onPokemonLongPress ? () => onPokemonLongPress(i) : undefined}
              onTap={onPokemonLongPress ? () => onPokemonLongPress(i) : undefined}
              draggable={canDrag}
              onDragStart={(e: React.DragEvent) => {
                setDragIndex(i);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(i));
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
                dragCounter.current = 0;
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounter.current++;
                setDragOverIndex(i);
              }}
              onDragLeave={() => {
                dragCounter.current--;
                if (dragCounter.current <= 0) {
                  setDragOverIndex(null);
                  dragCounter.current = 0;
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = dragIndex ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
                if (!isNaN(from) && from !== i) {
                  onReorderPokemon?.(from, i);
                }
                setDragIndex(null);
                setDragOverIndex(null);
                dragCounter.current = 0;
              }}
              className={`transition-all duration-200 rounded-2xl ${
                canDrag ? "cursor-grab active:cursor-grabbing" : onPokemonLongPress ? "cursor-pointer" : ""
              } ${isDragging ? "opacity-40 scale-95" : ""} ${
                isDragOver ? "ring-2 ring-accent ring-offset-2 ring-offset-background scale-[1.02]" : ""
              }`}
            >
              <FieldDiffHighlight field={[`pokemon:${i}`, `roles:${speciesKeys[i]}`]} label="Updated">
              <PokemonCard
                pokemon={mon}
                creatorMode={creatorMode}
                role={roles[speciesKeys[i]] ?? ""}
                onRoleChange={(text) => onRoleChange(speciesKeys[i], text)}
                isReadOnly={isReadOnly}
                isMvp={mvpIndex === i}
                onToggleMvp={() => onMvpIndexChange?.(mvpIndex === i ? null : i)}
                shiny={sc?.shiny}
                animated={sc?.animated}
                isMega={megaStates?.[i]}
                onToggleMega={onToggleMega ? () => onToggleMega(i) : undefined}
                regulation={tags?.regulation}
                showEvMode={showEvMode}
                onShowEvModeChange={onShowEvModeChange}
              />
              </FieldDiffHighlight>
            </LongPressWrapper>
          );
        })}
      </div>

      {/* App trademark */}
      <div className="text-center pt-4 sm:pt-6 mt-2 border-t border-border-subtle">
        <p className="text-xs text-text-tertiary/60 font-medium">
          {t.builtWith}{" "}
          <a
            href="https://x.com/Manny64Official"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-tertiary/80 hover:text-accent transition-colors font-bold"
          >
            @Manny64Official
          </a>
        </p>
      </div>

    </div>
  );
}
