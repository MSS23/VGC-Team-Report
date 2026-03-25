"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";

interface ExploreFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  sort: "newest" | "updated";
  onSortChange: (s: "newest" | "updated") => void;
}

export function ExploreFilters({
  query,
  onQueryChange,
  sort,
  onSortChange,
}: ExploreFiltersProps) {
  const { t } = useTranslation();
  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQueryChange(localQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localQuery, onQueryChange]);

  // Sync external changes
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  return (
    <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-lg border-b border-border/50 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as "newest" | "updated")}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer sm:w-48"
        >
          <option value="newest">{t.sortNewest}</option>
          <option value="updated">{t.sortUpdated}</option>
        </select>
      </div>
    </div>
  );
}
