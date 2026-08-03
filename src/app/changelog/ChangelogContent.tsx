"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";

import { applyRandomAccent } from "@/lib/utils/random-accent";

import { PageFooter } from "@/components/layout/PageFooter";
import type { ChangelogEntry, EntryType } from "./data";
import { ReducedMotionProvider } from "@/components/providers/ReducedMotionProvider";

// Type-system color tokens. Each maps to a swatch that passes WCAG AA on
// both the light surface (#FFFFFF) and the dark surface (#141428) used by
// the changelog cards. The tinted bg + colored text + matching ring keeps
// the badges legible without depending on the theme accent.
const TYPE_STYLES: Record<EntryType, {
  label: string;
  badge: string;
  dot: string;
  rail: string;
}> = {
  new: {
    label: "New",
    badge:
      "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300 dark:ring-emerald-400/30",
    dot: "bg-emerald-500",
    rail: "bg-emerald-500/60",
  },
  improved: {
    label: "Improved",
    badge:
      "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300 dark:ring-sky-400/30",
    dot: "bg-sky-500",
    rail: "bg-sky-500/60",
  },
  fixed: {
    label: "Fixed",
    badge:
      "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300 dark:ring-amber-400/30",
    dot: "bg-amber-500",
    rail: "bg-amber-500/60",
  },
};

type FilterType = EntryType | "all";

interface ChangelogContentProps {
  entries: ChangelogEntry[];
}

export function ChangelogContent({ entries }: ChangelogContentProps) {
  return (
    <I18nProvider>
      <ReducedMotionProvider>
        <ChangelogInner entries={entries} />
      </ReducedMotionProvider>
    </I18nProvider>
  );
}

function ChangelogInner({ entries }: ChangelogContentProps) {
  useEffect(() => {
    applyRandomAccent();
  }, []);

  const [filter, setFilter] = useState<FilterType>("all");
  const [query, setQuery] = useState("");
  const tabListRef = useRef<HTMLDivElement>(null);
  // The two most recent releases start expanded so the latest news is
  // visible without a click. Everything else is collapsed by default —
  // a 28-version page would be overwhelming otherwise.
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    () => new Set([entries[0]?.version, entries[1]?.version].filter(Boolean)),
  );

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  };

  const expandAll = () => setExpandedVersions(new Set(entries.map((e) => e.version)));
  const collapseAll = () => setExpandedVersions(new Set());

  // Filtering — narrow visible entries (and items within them) by the
  // currently selected type and free-text query. Hides any version whose
  // items all get filtered out so the timeline doesn't have empty cards.
  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.map((entry) => {
      const filteredItems = entry.items.filter((it) => {
        if (filter !== "all" && it.type !== filter) return false;
        if (q && !it.text.toLowerCase().includes(q) && !entry.title.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      });
      return { ...entry, items: filteredItems };
    }).filter((entry) => entry.items.length > 0);
  }, [filter, query, entries]);

  const totalNew = entries.reduce((sum, e) => sum + e.items.filter((i) => i.type === "new").length, 0);
  const totalImproved = entries.reduce((sum, e) => sum + e.items.filter((i) => i.type === "improved").length, 0);
  const totalFixed = entries.reduce((sum, e) => sum + e.items.filter((i) => i.type === "fixed").length, 0);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Soft accent glow behind the hero. Pure decoration; pointer-events
          off so it never blocks clicks. The radial-gradient ramps from
          accent → transparent so it inherits the user's theme color. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-[0.18] dark:opacity-[0.22]"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, var(--accent) 0%, transparent 60%)",
        }}
      />

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 pb-24 sm:pb-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-accent-surface flex items-center justify-center ring-1 ring-accent/20">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent"
                aria-hidden
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Changelog</h1>
              <p className="text-sm text-text-secondary">Every shipped change, version by version</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <CountPill color="emerald" label={`${totalNew} new features`} />
            <CountPill color="sky" label={`${totalImproved} improvements`} />
            <CountPill color="amber" label={`${totalFixed} fixes`} />
            <span className="text-xs text-text-tertiary font-medium ml-1">across {entries.length} releases</span>
          </div>
        </motion.div>

        {/* Controls — search + type filter + expand/collapse */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="mb-8 flex flex-col sm:flex-row gap-3 sm:items-center"
        >
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the changelog…"
              aria-label="Search the changelog"
              className="w-full min-h-11 pl-9 pr-3 py-2.5 text-sm rounded-xl bg-surface border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition placeholder:text-text-tertiary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div ref={tabListRef} role="tablist" aria-label="Filter changes by type" className="inline-flex rounded-xl bg-surface border border-border p-1 gap-0.5">
              {(["all", "new", "improved", "fixed"] as FilterType[]).map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setFilter(f)}
                    onKeyDown={(e) => {
                      const tabs = [...(tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])];
                      const idx = tabs.indexOf(e.currentTarget);
                      if (e.key === "ArrowRight") { e.preventDefault(); tabs[(idx + 1) % tabs.length]?.focus(); }
                      if (e.key === "ArrowLeft") { e.preventDefault(); tabs[(idx - 1 + tabs.length) % tabs.length]?.focus(); }
                      if (e.key === "Home") { e.preventDefault(); tabs[0]?.focus(); }
                      if (e.key === "End") { e.preventDefault(); tabs[tabs.length - 1]?.focus(); }
                    }}
                    className={`min-h-11 px-3 py-2 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                      active
                        ? "bg-accent text-accent-on shadow-sm shadow-accent/30"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {f === "all" ? "All" : TYPE_STYLES[f as EntryType].label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={expandedVersions.size === entries.length ? collapseAll : expandAll}
              className="min-h-11 px-3 py-2 text-xs font-bold rounded-lg bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition cursor-pointer"
            >
              {expandedVersions.size === entries.length ? "Collapse all" : "Expand all"}
            </button>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical rail. Subtle accent fade at the top so it feels like
              the timeline flows out of the hero. */}
          <div
            aria-hidden
            className="absolute left-[19px] top-0 bottom-0 w-px hidden sm:block"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--accent) 35%, transparent), var(--border) 18%, var(--border) 92%, transparent)",
            }}
          />

          {filteredEntries.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center">
              <p className="text-sm text-text-secondary">
                No changes match your search. Try clearing the filter or query.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredEntries.map((entry, i) => {
                const isExpanded = expandedVersions.has(entry.version);
                const newCount = entry.items.filter((it) => it.type === "new").length;
                const improvedCount = entry.items.filter((it) => it.type === "improved").length;
                const fixedCount = entry.items.filter((it) => it.type === "fixed").length;
                const anchorId = `v${entry.version.replace(/\./g, "-")}`;

                return (
                  <motion.section
                    key={entry.version}
                    id={anchorId}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.04, duration: 0.4 }}
                    className="relative sm:pl-14 scroll-mt-24"
                  >
                    {/* Timeline node. Highlight versions get the accent
                        treatment; others get a neutral surface bubble. */}
                    <div
                      className={`hidden sm:flex absolute left-0 top-4 w-10 h-10 rounded-full items-center justify-center z-10 transition-transform duration-300 hover:scale-105 ${
                        entry.highlight
                          ? "bg-accent text-accent-on shadow-lg shadow-accent/30 ring-4 ring-accent/15"
                          : "bg-surface border-2 border-border text-text-tertiary"
                      }`}
                      aria-hidden
                    >
                      <span className="text-base">{entry.emoji}</span>
                    </div>

                    {/* Card */}
                    <article
                      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                        entry.highlight
                          ? "border-accent/30 bg-gradient-to-br from-accent-surface/30 to-surface shadow-sm shadow-accent/10"
                          : "border-border bg-surface hover:border-accent/25"
                      }`}
                    >
                      {/* Clickable header — always visible */}
                      <button
                        type="button"
                        onClick={() => toggleVersion(entry.version)}
                        aria-expanded={isExpanded}
                        aria-controls={`${anchorId}-items`}
                        className="w-full px-4 sm:px-5 py-4 flex items-center gap-3 text-left cursor-pointer group"
                      >
                        <span className="sm:hidden text-xl flex-shrink-0">{entry.emoji}</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold rounded-lg tracking-wide flex-shrink-0 font-mono ${
                            entry.highlight ? "bg-accent text-accent-on" : "bg-accent-surface text-accent"
                          }`}
                        >
                          v{entry.version}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                            {entry.title}
                          </h2>
                          <span className="text-[11px] text-text-tertiary font-medium">{entry.date}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0" aria-hidden>
                          {newCount > 0 && <MiniCount color="emerald">{newCount}</MiniCount>}
                          {improvedCount > 0 && <MiniCount color="sky">{improvedCount}</MiniCount>}
                          {fixedCount > 0 && <MiniCount color="amber">{fixedCount}</MiniCount>}
                        </div>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-text-tertiary flex-shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {/* Items — collapsible */}
                      <div
                        id={`${anchorId}-items`}
                        className={`grid transition-all duration-300 ease-out ${
                          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <ul className="px-4 sm:px-5 pb-5 pt-3 space-y-2.5 border-t border-border/60">
                            {entry.items.map((item, j) => {
                              const style = TYPE_STYLES[item.type];
                              return (
                                <li key={j} className="flex items-start gap-3 group/item">
                                  <span
                                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-extrabold rounded-md tracking-wider uppercase mt-0.5 ${style.badge}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden />
                                    {style.label}
                                  </span>
                                  <span className="text-[13px] sm:text-sm text-text-secondary leading-relaxed">{item.text}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </article>
                  </motion.section>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-sm text-text-tertiary mb-4">Have an idea for the next update?</p>
          <a
            href="/feedback"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-on text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Send Feedback
          </a>
        </motion.div>
      </main>

      <PageFooter />
    </div>
  );
}

function CountPill({ color, label }: { color: "emerald" | "sky" | "amber"; label: string }) {
  const cls =
    color === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300 dark:ring-emerald-400/30"
      : color === "sky"
      ? "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300 dark:ring-sky-400/30"
      : "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300 dark:ring-amber-400/30";
  const dotCls =
    color === "emerald" ? "bg-emerald-500" : color === "sky" ? "bg-sky-500" : "bg-amber-500";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} aria-hidden />
      {label}
    </span>
  );
}

function MiniCount({ color, children }: { color: "emerald" | "sky" | "amber"; children: React.ReactNode }) {
  const cls =
    color === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : color === "sky"
      ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${cls}`}>
      {children}
    </span>
  );
}
