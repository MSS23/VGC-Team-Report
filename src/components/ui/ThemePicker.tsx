"use client";

import { ACCENT_THEMES, VIEW_TIERS, getUnlockedCount, getNextTier, applyAccentTheme } from "@/lib/accent-themes";

interface ThemePickerProps {
  totalViews: number;
  selectedTheme: string | null;
  onSelect: (themeId: string) => void;
}

export function ThemePicker({ totalViews, selectedTheme, onSelect }: ThemePickerProps) {
  const unlockedCount = getUnlockedCount(totalViews);
  const nextTier = getNextTier(totalViews);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
          Accent Theme
        </label>
        <p className="text-xs text-text-tertiary mb-3">
          Unlock themes by getting views on your public reports.
          {nextTier && (
            <span className="text-text-secondary font-medium">
              {" "}Next unlock at {nextTier.views.toLocaleString()} views ({totalViews.toLocaleString()}/{nextTier.views.toLocaleString()})
            </span>
          )}
          {!nextTier && (
            <span className="text-accent font-medium"> All themes unlocked!</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {ACCENT_THEMES.map((theme, i) => {
          const isUnlocked = i < unlockedCount;
          const isSelected = (selectedTheme || "rose") === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                if (!isUnlocked) return;
                onSelect(theme.id);
                applyAccentTheme(theme);
              }}
              disabled={!isUnlocked}
              title={isUnlocked ? theme.name : `Unlock at ${VIEW_TIERS.find((t) => t.unlocks > i)?.views.toLocaleString() ?? "?"} views`}
              className={`
                relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all
                ${isSelected ? "border-accent ring-2 ring-accent/30 bg-accent-surface" : "border-border hover:border-text-tertiary"}
                ${!isUnlocked ? "opacity-40 cursor-not-allowed grayscale" : "cursor-pointer"}
              `}
            >
              {/* Color swatch */}
              <div
                className="w-8 h-8 rounded-lg shadow-sm"
                style={{ backgroundColor: theme.accent }}
              />
              <span className="text-[10px] font-bold text-text-secondary leading-none">{theme.name}</span>

              {/* Lock icon for locked themes */}
              {!isUnlocked && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-surface-alt border border-border rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Checkmark for selected */}
              {isSelected && isUnlocked && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar to next tier */}
      {nextTier && (
        <div className="mt-2">
          <div className="h-1.5 bg-surface-alt border border-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totalViews / nextTier.views) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
