"use client";

// Pieces of the shared-report social section, moved verbatim out of
// HomePageClient.tsx. CommentSection and TeamCardCTA stay there (dynamic imports).
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { CloseIcon, ForkIcon, GlobeIcon, LinkIcon, LockIcon } from "@/components/ui/icons";
import { CreatorLink } from "@/components/social/CreatorLink";
import { ViewCount } from "@/components/social/ViewCount";

interface SharedReportActionsProps {
  creatorName: string | undefined;
  collaboratorNames: string[];
  viewCount: number;
  isOwner: boolean;
  isPublic: boolean;
  isUnlisted: boolean;
  warnings: string[];
  onSetVisibility: (isPublic: boolean, isUnlisted: boolean) => void;
  isSignedIn: boolean | undefined;
  forkStatus: "idle" | "forking" | "error";
  onFork: () => void;
}

/** Creator info + secondary actions (visibility cycle, fork). */
export function SharedReportActions({
  creatorName,
  collaboratorNames,
  viewCount,
  isOwner,
  isPublic,
  isUnlisted,
  warnings,
  onSetVisibility,
  isSignedIn,
  forkStatus,
  onFork,
}: SharedReportActionsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
      {creatorName && (
        <div className="flex items-center gap-1 flex-wrap">
          <CreatorLink name={creatorName} />
          {collaboratorNames && collaboratorNames.length > 0 && (
            <>
              <span className="text-xs text-text-tertiary">&amp;</span>
              {collaboratorNames.map((name, i) => (
                <span key={name} className="flex items-center gap-1">
                  {i > 0 && <span className="text-xs text-text-tertiary">,</span>}
                  <a
                    href={`/creator/${encodeURIComponent(name)}`}
                    className="text-xs font-semibold text-text-secondary hover:text-accent transition-colors"
                  >
                    {name}
                  </a>
                </span>
              ))}
            </>
          )}
        </div>
      )}
      <ViewCount count={viewCount} />
      {isOwner && (
        <button
          type="button"
          onClick={() => {
            if (!isPublic && !isUnlisted && warnings.length > 0) return;
            // Cycle: private → unlisted → public → private
            if (!isPublic && !isUnlisted) {
              onSetVisibility(false, true);
            } else if (isUnlisted) {
              if (warnings.length > 0) return;
              onSetVisibility(true, false);
            } else {
              onSetVisibility(false, false);
            }
          }}
          disabled={!isPublic && !isUnlisted && warnings.length > 0}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${
            !isPublic && !isUnlisted && warnings.length > 0
              ? "cursor-not-allowed opacity-50 bg-surface border-border text-text-tertiary"
              : isPublic
              ? "cursor-pointer bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : isUnlisted
              ? "cursor-pointer bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              : "cursor-pointer bg-surface border-border text-text-tertiary hover:border-accent/30 hover:text-accent"
          }`}
          title={
            !isPublic && !isUnlisted && warnings.length > 0
              ? "Fix team warnings before publishing"
              : isPublic
              ? "Public — click to make private"
              : isUnlisted
              ? "Unlisted (link only) — click to publish on Explore"
              : "Private — click to make unlisted"
          }
        >
          {isPublic ? (
            <GlobeIcon width="14" height="14" />
          ) : isUnlisted ? (
            <LinkIcon width="14" height="14" />
          ) : (
            <LockIcon width="14" height="14" />
          )}
          {isPublic ? "Public" : isUnlisted ? "Unlisted" : "Private"}
        </button>
      )}
      {/* Fork button — only on public reports, and only for non-owners.
          Unlisted reports cannot be forked: possession of the link grants
          view, not the right to copy the team into a new report. */}
      {isPublic && !isOwner && (
        isSignedIn ? (
          <button
            type="button"
            onClick={onFork}
            disabled={forkStatus === "forking"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border transition-all ${
              forkStatus === "forking"
                ? "opacity-60 cursor-wait text-text-tertiary"
                : forkStatus === "error"
                  ? "border-rose-500/40 text-rose-500"
                  : "text-text-secondary hover:border-accent/30 hover:text-accent cursor-pointer"
            }`}
            title="Fork this report — copy the team, notes, calcs, and matchup plans into a new report you own. The new report will link back to this one."
          >
            <ForkIcon width="14" height="14" />
            {forkStatus === "forking"
              ? "Forking…"
              : forkStatus === "error"
                ? "Fork failed"
                : "Fork Report"}
          </button>
        ) : (
          <SignInButton mode="modal">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer"
              title="Sign in to fork this report into your own editable copy"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <path d="M18 9v1a2 2 0 01-2 2H8a2 2 0 01-2-2V9" />
                <line x1="12" y1="12" x2="12" y2="15" />
              </svg>
              Fork Report
            </button>
          </SignInButton>
        )
      )}
      {/* Save toggle lives in the Navbar overflow menu (single source
          of truth) — having two copies fired /api/user/saved twice on
          mount and the late initial fetch could overwrite the user's
          optimistic toggle. */}
    </div>
  );
}

/** End-of-report conversion CTA for non-owner viewers on the last slide. */
export function EndOfReportCta({ isSignedIn, onDismiss }: { isSignedIn: boolean | undefined; onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-gradient-to-br from-accent/10 via-accent-surface/15 to-transparent border border-accent/25 rounded-2xl animate-fade-in">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary">You&apos;ve reached the end!</p>
          <p className="text-xs text-text-secondary mt-0.5 hidden sm:block">
            Build your own team report — add notes, calcs, matchup plans, and share it with the community.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isSignedIn ? (
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- shared reports render on "/?s=…", so going home needs a full load to reset the report state
          <a
            href="/"
            className="inline-flex min-h-11 items-center px-3.5 py-2 bg-accent text-accent-foreground text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
          >
            Create yours
          </a>
        ) : (
          <SignUpButton mode="modal">
            <button
              type="button"
              className="px-3.5 py-2 bg-accent text-accent-foreground text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30 cursor-pointer"
            >
              Sign up free
            </button>
          </SignUpButton>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <CloseIcon width="12" height="12" strokeWidth="2.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Shown in place of the comment section when the creator turned comments off. */
export function CommentsDisabledNotice() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-surface-alt/50 border border-border rounded-xl text-xs text-text-tertiary">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
      </svg>
      <span>Comments are turned off by the creator.</span>
    </div>
  );
}
