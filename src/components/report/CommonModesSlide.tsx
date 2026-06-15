"use client";

import { useTranslation } from "@/lib/i18n";
import { FieldDiffHighlight } from "./TeamReport";

/** The creator-authored "how to pilot this team" object. All keys optional. */
export interface CommonModesValue {
  leads?: string;
  modes?: string;
  strengths?: string;
  weaknesses?: string;
  gameplan?: string;
}

interface CommonModesSlideProps {
  commonModes: CommonModesValue | undefined;
  onChange: (value: CommonModesValue) => void;
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
  key: keyof CommonModesValue;
  /** i18n key for the label */
  labelKey: string;
  /** i18n key for the textarea placeholder */
  placeholderKey: string;
  accent: Accent;
}

const BLOCKS: BlockDef[] = [
  { key: "leads", labelKey: "commonLeads", placeholderKey: "commonLeadsPlaceholder", accent: "accent" },
  { key: "modes", labelKey: "commonModesField", placeholderKey: "commonModesPlaceholder", accent: "accent" },
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

export function CommonModesSlide({
  commonModes,
  onChange,
  isReadOnly,
  isPresentationMode,
}: CommonModesSlideProps) {
  const { t } = useTranslation();

  // The Integrate phase adds the commonModes i18n keys to every translation
  // file. Until then `t` (a closed TranslationKeys type derived from `en`)
  // doesn't statically know these keys, so read them through an index helper
  // with a graceful fallback — once the keys land, `t.*` supplies the value.
  const tr = (key: string, fallback: string): string => {
    const dict = t as unknown as Record<string, string | undefined>;
    return dict[key] ?? fallback;
  };

  const value = commonModes ?? {};

  const setKey = (key: keyof CommonModesValue, text: string) => {
    onChange({ ...value, [key]: text });
  };

  const hasAny = BLOCKS.some((b) => (value[b.key] ?? "").trim().length > 0);

  return (
    <FieldDiffHighlight field="commonModes" label="How to play changed">
      <div
        className={`flex flex-col gap-3 sm:gap-6 animate-fade-in ${
          isPresentationMode ? "presenting:gap-8" : ""
        }`}
      >
        {/* Section header */}
        <div>
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
            <div className="flex flex-col gap-2.5 sm:gap-4">
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
            </div>
          )}
        </div>
      </div>
    </FieldDiffHighlight>
  );
}
