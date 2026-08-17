"use client";

import { MotionDiv } from "@/components/ui/LazyMotion";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

const SUBSTITUTE_URL =
  "https://play.pokemonshowdown.com/sprites/gen5/substitute.png";

const POPULAR_PILLS = ["Groudon Sun", "Calyrex Shadow", "Flutter Mane"];

interface ExploreEmptyProps {
  hasSearch: boolean;
  hasActiveFilters?: boolean;
  onSearch?: (query: string) => void;
  onClearFilters?: () => void;
}

export function ExploreEmpty({
  hasSearch,
  hasActiveFilters = false,
  onSearch,
  onClearFilters,
}: ExploreEmptyProps) {
  const { t } = useTranslation();

  return (
    <MotionDiv
      className="flex flex-col items-center justify-center py-20 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <img
        src={SUBSTITUTE_URL}
        alt=""
        width={80}
        height={80}
        className="opacity-30 mb-6"
        style={{ imageRendering: "pixelated" }}
      />
      <h3 className="text-lg font-bold text-text-primary mb-2">
        {hasSearch ? t.noSearchResults : t.noPublicReports}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm">
        {hasSearch
          ? t.tryDifferentSearch
          : t.beTheFirst}
      </p>

      {/* Filtered search: clear filters + popular search pills */}
      {(hasSearch || hasActiveFilters) && (
        <div className="mt-6 flex flex-col items-center gap-4">
          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border-2 border-border bg-surface text-sm font-bold text-text-primary hover:border-accent/40 hover:bg-accent-surface active:scale-[0.97] transition-all cursor-pointer"
            >
              Clear filters
            </button>
          )}
          {onSearch && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-text-tertiary font-medium">Try a popular search:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_PILLS.map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => onSearch(pill)}
                    className="min-h-[44px] px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cold-start (no content at all): build CTA + demo link */}
      {!hasSearch && !hasActiveFilters && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide min-h-[44px]"
          >
            {t.buildYourOwn}
          </Link>
          <Link
            href="/?sample=sample-groudon-sun"
            className="inline-flex min-h-11 items-center text-sm text-text-tertiary hover:text-accent transition-colors font-medium"
          >
            See how a report looks &rarr;
          </Link>
        </div>
      )}
    </MotionDiv>
  );
}
