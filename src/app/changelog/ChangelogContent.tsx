"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";

import { applyRandomAccent } from "@/lib/utils/random-accent";

import { PageFooter } from "@/components/layout/PageFooter";

const ENTRIES = [
  {
    date: "May 2026",
    version: "5.10",
    title: "OG Share Cards, JSON-LD AI Citation, Sample Teams & Performance",
    emoji: "🤖",
    highlight: true,
    items: [
      { type: "new" as const, text: "Social share preview cards restored. Shared team report links on Twitter/Discord now display a visual card with all 6 Pokémon sprites, tournament name, and placement. Each sprite fetch has a 2.5-second timeout with Pokéball fallback so the card always renders — the previous timeout issue that caused the suppression is fixed." },
      { type: "new" as const, text: "FAQPage, Organization, WebSite, and HowTo JSON-LD schemas are now active on the homepage. These components were fully built but never imported — activating them is the top fix for AI assistant citation (ChatGPT, Perplexity, Claude) and Google rich results. Includes a HowTo schema for creating a team report." },
      { type: "new" as const, text: "3 pre-built Champions sample teams added — Mega Kangaskhan Goodstuffs, Primal Groudon Sun, and Primal Kyogre Rain — accessible from the Champions page with a one-click Try button that loads the full Showdown paste into the report editor." },
      { type: "improved" as const, text: "posthog-js (~150 KB) is now deferred until browser idle time using requestIdleCallback. It was previously parsed on every page at layout level. All 10 consumer components updated to use a usePostHog shim that resolves after the dynamic import, with no change to the existing null-guard patterns." },
      { type: "fixed" as const, text: "Tournament page 'View top teams' CTA links were silently broken — they passed ?tournament={id} which the explore filter ignores. Links now pass ?q={name}&searchType=tournament which the explore page actually handles." },
      { type: "fixed" as const, text: "ShareModal clipboard handlers (Copy Link, Copy Discord, Copy Embed) now have try/catch around navigator.clipboard.writeText(). The API throws on non-HTTPS or permission-denied, causing a silent unhandled rejection. Also migrated from bare posthog-js import to the project-standard usePostHog hook." },
      { type: "fixed" as const, text: "oEmbed endpoint now wraps shareId with encodeURIComponent() before HTML interpolation. The regex guard prevented exploitation but direct string interpolation into HTML was structurally unsafe." },
      { type: "fixed" as const, text: "3 critical WCAG 2.1 AA accessibility issues resolved: keyboard access added to the URL-copy div in ShareModal; creator/collaborator navigation spans in ReportCard converted to proper anchor elements; comment moderation buttons (delete/flag) had aria-hidden=true removed. Also fixed like button aria-label/aria-pressed and added aria-hidden to decorative SVGs." },
      { type: "improved" as const, text: "/faq and /tournaments added to XML sitemap. /compare page now has full metadata (title, description, OpenGraph, canonical). Root homepage title and description updated with VGC keyword targeting. /explore, /creator/[name] pages get expanded keyword metadata including OTS." },
      { type: "fixed" as const, text: "Removed orphaned BringSelector component (bring-selection logic had been re-implemented inline in MatchupPlanSlide). Also removed unused hidePageNavbar/showPageNavbar exports from PersistentNavbar." },
    ],
  },
  {
    date: "May 2026",
    version: "5.9",
    title: "Full Explore Feed, Format-Aware Mega Forms & Fork Credits",
    emoji: "🔁",
    highlight: true,
    items: [
      { type: "fixed" as const, text: "Popular and Views tabs on /explore now show the entire library, not just a subset. The pagination cursor was a single integer with strict less-than semantics, so once the feed reached the tied tail of teams sharing a like count or view count (most teams have 0 of either), the next-page query asked for \"likes < 0\" and returned nothing. Replaced with a composite cursor (metric, created_at) walked via Postgres tuple comparison so ties are paginated by created_at exactly as the ORDER BY intends. Same fix applied to the Views sort." },
      { type: "new" as const, text: "Fork credit on Explore cards. When a team is duplicated via the new Notion-style \"Duplicate this team\" CTA, the explore card now surfaces \"Duplicated from @{originalCreator}\" below the byline, linking to the original creator's profile. Server-side join over shares.forked_from_id so the credit always reflects ground truth. Pairs with the existing \"Forked from\" banner on the /s/{id} view itself, so attribution shows up at both the discovery surface and the report surface." },
      { type: "fixed" as const, text: "Mega forms now suppress themselves when the regulation isn't Reg M-A. Reg F, G, H, I and every other Scarlet/Violet regulation can't actually use Mega Evolution, so showing Mega-form analysis on those teams was misleading — viewers saw boosted Mega stats and the Mega ability when the team can never trigger Mega Evo in actual play." },
      { type: "fixed" as const, text: "The Mega flip toggle now requires both a Reg M-A regulation AND an actual Mega Stone equipped on the species. Without the Stone, Mega Evolution can't trigger in battle, so surfacing a flip control was misleading." },
    ],
  },
];

type EntryType = "new" | "fixed" | "improved";

const TYPE_LABEL: Record<EntryType, string> = {
  new: "New",
  fixed: "Fixed",
  improved: "Improved",
};

const TYPE_CLASS: Record<EntryType, string> = {
  new: "bg-green-500/10 text-green-400 border border-green-500/20",
  fixed: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  improved: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
};

export function ChangelogContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    applyRandomAccent();
  }, []);

  return (
    <I18nProvider>
      <main className="min-h-screen bg-[--bg] text-[--text]">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-2">Changelog</h1>
            <p className="text-[--text-muted]">What&apos;s new in VGC Team Report</p>
          </div>

          <div className="space-y-12">
            {ENTRIES.map((entry, i) => (
              <motion.div
                key={`${entry.version}-${i}`}
                initial={mounted ? { opacity: 0, y: 16 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-0.5 select-none">{entry.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-[--text-muted]">{entry.date}</span>
                      <span className="text-xs font-mono font-bold text-[--accent] bg-[--accent]/10 px-2 py-0.5 rounded">
                        v{entry.version}
                      </span>
                      {entry.highlight && (
                        <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          Highlight
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold mb-3">{entry.title}</h2>
                    <ul className="space-y-2">
                      {entry.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${TYPE_CLASS[item.type]}`}>
                            {TYPE_LABEL[item.type]}
                          </span>
                          <span className="text-sm text-[--text-muted] leading-relaxed">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <PageFooter />
      </main>
    </I18nProvider>
  );
}
