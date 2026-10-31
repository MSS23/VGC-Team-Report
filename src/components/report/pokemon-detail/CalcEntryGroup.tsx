"use client";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useIsPrintMode } from "@/components/ui/print-context";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
export const CATEGORY_CONFIG = {
  offensive: {
    label: "Offensive",
    icon: "\u2694\uFE0F",
    borderClass: "border-red-400/25",
    leftBorder: "border-l-red-400",
    bgClass: "bg-red-500/8",
    presentBgClass: "presenting:bg-red-500/12",
    tagBg: "bg-red-500/15",
    tagText: "text-red-500 dark:text-red-400",
    iconColor: "text-red-400",
    bulletColor: "text-red-400/70",
  },
  defensive: {
    label: "Defensive",
    icon: "\uD83D\uDEE1\uFE0F",
    borderClass: "border-emerald-400/25",
    leftBorder: "border-l-emerald-400",
    bgClass: "bg-emerald-500/8",
    presentBgClass: "presenting:bg-emerald-500/12",
    tagBg: "bg-emerald-500/15",
    tagText: "text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-400",
    bulletColor: "text-emerald-400/70",
  },
  speed: {
    label: "Speed Tier",
    icon: "\u26A1",
    borderClass: "border-amber-400/25",
    leftBorder: "border-l-amber-400",
    bgClass: "bg-amber-500/8",
    presentBgClass: "presenting:bg-amber-500/12",
    tagBg: "bg-amber-500/15",
    tagText: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-400",
    bulletColor: "text-amber-400/70",
  },
} as const;

type CategoryCfg = typeof CATEGORY_CONFIG[CalcCategory];

function EditableCalcEntry({
  entry,
  cfg,
  isReadOnly,
  onRemove,
  onEdit,
  categories,
}: {
  entry: CalcEntry;
  cfg: CategoryCfg;
  isReadOnly: boolean;
  onRemove: () => void;
  onEdit?: (updates: Partial<CalcEntry>) => void;
  categories: CalcCategory[];
}) {
  const { t } = useTranslation();
  const catLabelMap: Record<string, string> = {
    "Offensive": t.offensive,
    "Defensive": t.defensive,
    "Speed Tier": t.speedTier,
  };
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(entry.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== entry.text) {
      onEdit?.({ text: trimmed });
    }
    setEditing(false);
  };

  return (
    <div
      className={`group flex items-start gap-3 px-3 py-2.5 sm:px-4 sm:py-3 ${cfg.bgClass} ${cfg.presentBgClass} border ${cfg.borderClass} border-l-[3px] ${cfg.leftBorder} rounded-lg transition-all hover:shadow-sm presenting:px-5`}
    >
      <span className={`${cfg.bulletColor} text-sm mt-px flex-shrink-0 presenting:text-base`}>&#9656;</span>
      {editing && !isReadOnly ? (
        <textarea
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
            if (e.key === "Escape") { setEditText(entry.text); setEditing(false); }
          }}
          className="flex-1 text-sm sm:text-base text-text-primary leading-relaxed bg-transparent border-none resize-none min-h-[1.5em] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface rounded-sm"
          rows={1}
          spellCheck={false}
        />
      ) : (
        <span
          className={`flex-1 text-sm sm:text-base text-text-primary leading-relaxed ${!isReadOnly ? "cursor-text" : ""}`}
          onClick={() => {
            if (!isReadOnly && onEdit) {
              setEditText(entry.text);
              setEditing(true);
            }
          }}
        >
          {entry.text}
        </span>
      )}
      {!isReadOnly && (
        <div
          className="flex items-center gap-1 shrink-0 self-start"
          role="group"
          aria-label={t.changeCategory}
        >
          {/* Always-visible segmented category switcher */}
          {onEdit && (
            <div className="flex items-center gap-0.5 rounded-lg bg-surface-alt/60 border border-border p-0.5">
              {categories.map((cat) => {
                const catCfg = CATEGORY_CONFIG[cat];
                const isActive = entry.category === cat;
                const label = catLabelMap[catCfg.label] ?? catCfg.label;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (!isActive) onEdit({ category: cat });
                    }}
                    aria-label={`${t.changeCategory}: ${label}`}
                    aria-pressed={isActive}
                    title={label}
                    className={`inline-flex items-center justify-center h-11 w-11 sm:h-9 sm:w-9 rounded-md text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
                      isActive
                        ? `${catCfg.tagBg} ${catCfg.tagText} border ${catCfg.borderClass} shadow-sm`
                        : "text-text-tertiary hover:text-text-primary hover:bg-surface active:scale-95"
                    }`}
                  >
                    <span aria-hidden>{catCfg.icon}</span>
                    {isActive && <span className="sr-only"> (current)</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider */}
          <div className="mx-0.5 sm:mx-1 h-6 w-px bg-border" aria-hidden />

          {/* Delete */}
          <button
            type="button"
            onClick={onRemove}
            aria-label={t.removeCalc}
            title={t.removeCalc}
            className="inline-flex items-center justify-center h-11 w-11 sm:h-9 sm:w-9 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export function CollapsibleCalcGroup({
  category,
  cfg,
  entries,
  globalCalcs,
  isReadOnly,
  isPresentationMode,
  onRemoveCalc,
  onEditCalc,
  categories,
  translatedLabel,
}: {
  category: CalcCategory;
  cfg: CategoryCfg;
  entries: CalcEntry[];
  globalCalcs: CalcEntry[];
  isReadOnly: boolean;
  isPresentationMode: boolean;
  onRemoveCalc: (index: number) => void;
  onEditCalc?: (index: number, updates: Partial<CalcEntry>) => void;
  categories: CalcCategory[];
  translatedLabel: string;
}) {
  const isPrint = useIsPrintMode();
  const [isOpen, setIsOpen] = useState(!isPresentationMode);
  // Force open in print mode so all calcs are visible; guests can still toggle
  const effectiveOpen = isPrint || isOpen;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={effectiveOpen}
        className="flex items-center gap-2 w-full mb-1 group/header cursor-pointer"
      >
        <span className="text-sm">{cfg.icon}</span>
        <span className={`text-xs font-extrabold uppercase tracking-widest ${cfg.tagText}`}>
          {translatedLabel}
        </span>
        <span className={`text-xs font-semibold ${cfg.tagText} opacity-60`}>
          ({entries.length})
        </span>
        <span className={`flex-1 h-px ${cfg.tagBg}`} />
        <svg
          className={`w-3.5 h-3.5 ${cfg.tagText} opacity-50 group-hover/header:opacity-100 transition-all duration-200 ${effectiveOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-200 ease-in-out ${effectiveOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
        <div className="flex flex-col gap-2 pt-1">
          {entries.map((entry) => {
            const globalIndex = globalCalcs.indexOf(entry);
            return (
              <EditableCalcEntry
                key={globalIndex}
                entry={entry}
                cfg={cfg}
                isReadOnly={isReadOnly}
                onRemove={() => onRemoveCalc(globalIndex)}
                onEdit={onEditCalc ? (updates) => onEditCalc(globalIndex, updates) : undefined}
                categories={categories}
              />
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}


