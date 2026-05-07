"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { useSessionId } from "@/hooks/useSessionId";
import { useTranslation } from "@/lib/i18n";
import { relativeTime } from "@/lib/utils/relative-time";
import { getSpriteUrls } from "@/lib/utils/sprite-slug";

export interface ExploreReport {
  id: string;
  species: string[];
  tournamentName?: string;
  creatorName?: string;
  placement?: string;
  teamSummary?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  likeCount?: number;
  reactionCounts?: Record<string, number>;
  commentCount?: number;
  isVerified?: boolean;
  tags?: { archetype?: string[]; regulation?: string; eventType?: string; regulationAutoDetected?: boolean };
  collaborators?: string[];
  /** Whether the report's owner provided a rental code. Powers the "Rental code" filter
   *  on /explore and a small badge on the card so viewers can spot ready-to-import teams. */
  hasRental?: boolean;
  /** Original creator's display name when this report was forked from another. Renders
   *  a "Duplicated from @X" credit line so the original builder gets visible attribution. */
  forkedFromCreator?: string;
}

function getPlacementStyle(placement: string): string {
  if (placement === "1st") {
    // Gold — champion treatment
    return "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30";
  }
  if (placement === "Top 4") {
    // Silver — finalist treatment
    return "bg-slate-400/15 text-slate-600 dark:text-slate-300 ring-1 ring-slate-400/30";
  }
  if (placement === "Top 8") {
    // Bronze — strong showing
    return "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/25";
  }
  // Default — standard badge for Top 16 and other placements
  return "bg-accent-surface text-accent";
}

function CardSprite({ species }: { species: string }) {
  const urls = getSpriteUrls(species);
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={urls[Math.min(idx, urls.length - 1)]}
      alt={species}
      width={48}
      height={48}
      className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
      loading="lazy"
      onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

export function ReportCard({ report }: { report: ExploreReport }) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const sessionId = useSessionId();

  // Like state — initialize from server data, then allow interactive toggling
  const initialLikes = report.likeCount ?? (report.reactionCounts
    ? Object.values(report.reactionCounts).reduce((sum, c) => sum + c, 0)
    : 0);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  // Bookmark state
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Hide bookmark on own reports (compare Clerk username/fullName to creatorName)
  const isOwnReport = !!(user && report.creatorName && (
    user.username === report.creatorName ||
    user.fullName === report.creatorName ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() === report.creatorName
  ));

  // Check if current user already liked this report
  useEffect(() => {
    if (!sessionId || !report.id) return;
    fetch(`/api/reactions/${report.id}?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const total = Object.values(data.counts ?? {}).reduce(
            (sum: number, c) => sum + (c as number), 0);
          setLikeCount(total);
          setLiked((data.userReactions ?? []).length > 0);
        }
      })
      .catch(() => {});
  }, [report.id, sessionId]);

  // Check if current user already bookmarked this report
  useEffect(() => {
    if (!user || !report.id) return;
    fetch("/api/user/saved")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reports?.some((r: { id: string }) => r.id === report.id)) {
          setBookmarked(true);
        }
      })
      .catch(() => {});
  }, [user, report.id]);

  const toggleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId || !isSignedIn) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));

    try {
      await fetch(`/api/reactions/${report.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: "heart", sessionId }),
      });
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
    }
  }, [report.id, sessionId, liked, isSignedIn]);

  const toggleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    const wasSaved = bookmarked;
    setBookmarked(!wasSaved);
    try {
      await fetch("/api/user/saved", {
        method: wasSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: report.id }),
      });
    } catch {
      setBookmarked(wasSaved);
    } finally {
      setBookmarkLoading(false);
    }
  }, [report.id, bookmarked, bookmarkLoading]);

  // Archetype badges: show up to 3, then overflow
  const archetypes = report.tags?.archetype ?? [];
  const visibleArchetypes = archetypes.slice(0, 3);
  const overflowArchetypes = archetypes.length > 3 ? archetypes.length - 3 : 0;

  // Tags section: eventType only (archetypes moved above, regulation moved to corner)
  const hasTagsSection = !!report.tags?.eventType;

  return (
    <motion.a
      href={`/s/${report.id}`}
      className="relative block bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:border-accent/30 overflow-hidden group card-hover"
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {/* Regulation tag — always visible in top-right corner. Dashed
          border + "auto" suffix marks a machine-guessed format so viewers
          don't mistake it for a creator-claimed one. */}
      {report.tags?.regulation && (
        <span
          className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 z-10 inline-flex items-center gap-1 ${
            report.tags.regulationAutoDetected ? "border border-dashed border-blue-500/40" : ""
          }`}
          title={report.tags.regulationAutoDetected
            ? "Auto-detected from team composition — not confirmed by the creator"
            : undefined}
        >
          {report.tags.regulation}
          {report.tags.regulationAutoDetected && (
            <span className="text-[8px] opacity-70 uppercase">auto</span>
          )}
        </span>
      )}

      {/* Sprites row */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-1.5 sm:pb-2">
        <div className="bg-surface-alt/30 rounded-lg py-2">
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            {report.species.map((species, i) => (
              <CardSprite key={i} species={species} />
            ))}
            {Array.from({ length: Math.max(0, 6 - report.species.length) }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-alt"
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-1.5 sm:space-y-2">
        {/* Tournament + Placement */}
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-text-primary leading-tight group-hover:text-accent transition-colors line-clamp-2 sm:line-clamp-1">
            {report.tournamentName || report.species.join(" / ")}
          </h3>
          {report.placement && (
            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-md tracking-wide ${getPlacementStyle(report.placement)}`}>
              {(report.placement === "1st" || report.placement === "Top 4") && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="flex-shrink-0">
                  <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4L12 16.8l-6.3 4.6 2.3-7.4-6-4.6h7.6z" />
                </svg>
              )}
              {report.placement}
            </span>
          )}
        </div>

        {/* Archetype badges — below title, up to 3 */}
        {visibleArchetypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleArchetypes.map((a) => (
              <span key={a} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">{a}</span>
            ))}
            {overflowArchetypes > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-alt text-text-tertiary">+{overflowArchetypes}</span>
            )}
          </div>
        )}

        {/* Creator + Collaborators */}
        {report.creatorName && (
          <p className="text-xs text-text-secondary flex items-center gap-1 flex-wrap">
            <span>{t.byCreator}</span>
            <span
              className="font-semibold text-accent/80 hover:text-accent hover:underline transition-colors inline-flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/creator/${encodeURIComponent(report.creatorName!)}`;
              }}
            >
              {report.creatorName}
              {report.isVerified && (
                <span title="Verified creator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500 flex-shrink-0">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              )}
            </span>
            {report.collaborators && report.collaborators.length > 0 && (
              <>
                <span className="text-text-tertiary">collabed with</span>
                {report.collaborators.slice(0, 2).map((name, i) => (
                  <span key={name}>
                    {i > 0 && <span className="text-text-tertiary">, </span>}
                    <span
                      className="font-semibold hover:text-accent transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/creator/${encodeURIComponent(name)}`;
                      }}
                    >
                      {name}
                    </span>
                  </span>
                ))}
                {report.collaborators.length > 2 && (
                  <span className="text-text-tertiary">+{report.collaborators.length - 2}</span>
                )}
              </>
            )}
          </p>
        )}

        {/* Fork credit — when this report was duplicated from another, show
            the original creator visibly so the source builder gets attribution. */}
        {report.forkedFromCreator && (
          <p className="text-[10px] text-text-tertiary inline-flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="12" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="6" r="3" />
              <path d="M18 9v1a2 2 0 01-2 2H8a2 2 0 01-2-2V9" />
              <line x1="12" y1="12" x2="12" y2="15" />
            </svg>
            <span>Duplicated from</span>
            <a
              href={`/creator/${encodeURIComponent(report.forkedFromCreator)}`}
              className="font-semibold text-text-secondary hover:text-accent transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {report.forkedFromCreator}
            </a>
          </p>
        )}

        {/* Tags — eventType + rental availability */}
        {(hasTagsSection || report.hasRental) && (
          <div className="flex flex-wrap gap-1">
            {hasTagsSection && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">{report.tags!.eventType}</span>
            )}
            {report.hasRental && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5"
                title="Rental code available"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Rental
              </span>
            )}
          </div>
        )}

        {/* Social indicators + timestamp */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5">
            {/* Interactive heart / like button */}
            {isSignedIn ? (
              <button
                type="button"
                onClick={toggleLike}
                className="inline-flex items-center gap-1 text-[10px] cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={liked ? "text-red-500" : "text-text-tertiary hover:text-red-400 transition-colors"}>
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <span className={`font-bold ${liked || likeCount > 0 ? "text-text-secondary" : "text-text-tertiary"}`}>{likeCount}</span>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="inline-flex items-center gap-1 text-[10px] cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={likeCount > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={likeCount > 0 ? "text-red-500" : "text-text-tertiary hover:text-red-400 transition-colors"}>
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  <span className={`font-bold ${likeCount > 0 ? "text-text-secondary" : "text-text-tertiary"}`}>{likeCount}</span>
                </button>
              </SignInButton>
            )}
            {/* Bookmark */}
            {!isOwnReport && (
              isSignedIn ? (
                <button
                  type="button"
                  onClick={toggleBookmark}
                  disabled={bookmarkLoading}
                  className="inline-flex items-center gap-0.5 text-[10px] cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                  aria-label={bookmarked ? "Unsave report" : "Save report"}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={bookmarked ? "text-accent" : "text-text-tertiary hover:text-accent transition-colors"}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="inline-flex items-center gap-0.5 text-[10px] cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                    aria-label="Save report"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary hover:text-accent transition-colors">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </button>
                </SignInButton>
              )
            )}
            {/* Comments */}
            {(report.commentCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 text-text-tertiary">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className="text-[10px] font-bold">{report.commentCount}</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">
            {relativeTime(report.createdAt)}
          </span>
        </div>
      </div>
    </motion.a>
  );
}
