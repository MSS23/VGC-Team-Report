"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePostHog } from "@/components/providers/PostHogProvider";
import { track } from "@vercel/analytics";

interface ShareModalProps {
  publicUrl: string;
  teamSpecies: string[];
  tournamentName?: string;
  creatorName?: string;
  placement?: string;
  isPublic: boolean;
  isOwner?: boolean;
  /**
   * When true, the modal is being opened by a read-only viewer of someone
   * else's report (guest or logged-in non-owner/non-collaborator). Hides
   * the visibility toggle, comments toggle, publish prompt, and edit-link
   * bookmark warning — none of which apply to viewers — and changes the
   * header copy so it doesn't imply the viewer just saved something.
   */
  viewerMode?: boolean;
  onTogglePublic: (v: boolean) => void;
  allowComments: boolean;
  onToggleComments: (v: boolean) => void;
  onClose: () => void;
  tags?: { regulation?: string; eventType?: string; archetype?: string[] };
  warnings?: string[];
  /** Error returned from the server when a visibility toggle fails (e.g. 403 owner mismatch). */
  publishError?: string | null;
  /** Called after the user dismisses or the UI consumes a publishError. */
  onClearPublishError?: () => void;
}

export function ShareModal({
  publicUrl,
  teamSpecies,
  tournamentName,
  creatorName,
  placement,
  isPublic,
  isOwner = true,
  viewerMode = false,
  onTogglePublic,
  allowComments,
  onToggleComments,
  onClose,
  tags,
  warnings = [],
  publishError = null,
  onClearPublishError,
}: ShareModalProps) {
  const posthog = usePostHog();
  const [linkCopied, setLinkCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [publicConfirmDismissed, setPublicConfirmDismissed] = useState(false);
  const [tagError, setTagError] = useState(false);
  const [creatorError, setCreatorError] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Detect Web Share API support client-side only (SSR-safe)
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = "share-modal-title";

  const hasTags = !!(tags?.regulation || tags?.eventType || (tags?.archetype && tags.archetype.length > 0));
  const hasCreator = !!creatorName?.trim();

  // Clear errors if requirements are met while modal is open
  useEffect(() => {
    if (hasTags && tagError) setTagError(false);
  }, [hasTags, tagError]);
  useEffect(() => {
    if (hasCreator && creatorError) setCreatorError(false);
  }, [hasCreator, creatorError]);

  const hasWarnings = warnings.length > 0;

  const handleTogglePublic = (v: boolean) => {
    // Block publishing to Explore when team has warnings/errors
    if (v && hasWarnings) return;
    if (v && !hasCreator) {
      setCreatorError(true);
      return;
    }
    if (v && !hasTags) {
      setTagError(true);
      return;
    }
    setTagError(false);
    setCreatorError(false);
    // Celebrate the transition from private → public
    if (v && !isPublic) {
      setJustPublished(true);
    } else if (!v) {
      setJustPublished(false);
    }
    onTogglePublic(v);
  };

  // Focus trap + Escape handler
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    // Remember the element that had focus before the modal opened so we can restore it on close
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Focus first focusable element on mount
    const firstFocusable = modal.querySelector<HTMLElement>(focusableSelectors);
    firstFocusable?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(modal.querySelectorAll<HTMLElement>(focusableSelectors));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      // Restore focus to the element that triggered the modal
      previouslyFocused?.focus();
    };
  }, [onClose]);

  // Extract share ID for embed snippet (only available for short /s/ URLs)
  const shareIdMatch = publicUrl.match(/\/s\/([^/?#]+)/);
  const shareId = shareIdMatch ? shareIdMatch[1] : null;
  const embedUrl = shareId ? `https://pokemonvgcteamreport.com/embed/${shareId}` : null;
  const embedSnippet = embedUrl
    ? `<iframe src="${embedUrl}" width="100%" height="500" style="border:none;border-radius:8px;" title="VGC Team Report" loading="lazy"></iframe>`
    : null;

  const handleCopyEmbed = async () => {
    if (!embedSnippet) return;
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
      track("share_embed_copied");
      posthog?.capture("share_embed_copied", { has_tournament: !!tournamentName });
    } catch {
      // Clipboard unavailable (non-HTTPS or permission denied) — no-op; the
      // embed snippet is already visible in the UI and selectable by the user.
    }
  };

  // Detect if this is a short DB-backed URL or the long fallback
  const isShortUrl = publicUrl.includes("/s/") && !publicUrl.includes("#data=");
  const displayUrl = isShortUrl
    ? publicUrl
    : publicUrl.replace(/^https?:\/\//, "").split("#")[0] + "/...";

  const speciesText = teamSpecies.join(" / ");

  // Build share text variants (only useful with short URLs)
  const twitterText = tournamentName
    ? `Check out my ${tournamentName}${placement ? ` (${placement})` : ""} VGC team report: ${speciesText}\n\n${publicUrl}\n\n#PokemonChampions #VGC2026\nMade with @VGCTeamReport`
    : `Check out my VGC team report: ${speciesText}\n\n${publicUrl}\n\n#PokemonChampions #VGC2026\nMade with @VGCTeamReport`;

  const redditTitle = tournamentName
    ? `[Team Report] ${tournamentName}${placement ? ` - ${placement}` : ""}: ${speciesText}`
    : `[Team Report] ${speciesText}`;

  const discordText = tournamentName
    ? `**${tournamentName}**${placement ? ` (${placement})` : ""}${creatorName ? ` by ${creatorName}` : ""}\n${speciesText}\n${publicUrl}`
    : `**VGC Team Report**${creatorName ? ` by ${creatorName}` : ""}\n${speciesText}\n${publicUrl}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
  const redditUrl = `https://www.reddit.com/r/VGC/submit?type=link&title=${encodeURIComponent(redditTitle)}&url=${encodeURIComponent(publicUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      track("share_link_copied");
      posthog?.capture("share_link_copied", { is_short_url: isShortUrl });
    } catch {
      // Clipboard unavailable (non-HTTPS or permission denied) — no-op; the
      // URL is visible in the display row and the user can select it manually.
    }
  };

  const handleCopyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(discordText);
      setDiscordCopied(true);
      setTimeout(() => setDiscordCopied(false), 2000);
      track("share_discord_copied");
      posthog?.capture("share_discord_copied", { has_tournament: !!tournamentName });
    } catch {
      // Clipboard unavailable (non-HTTPS or permission denied) — no-op.
    }
  };

  const handleNativeShare = async () => {
    const title = tournamentName
      ? `${tournamentName}${placement ? ` (${placement})` : ""} VGC Team Report`
      : "VGC Team Report";
    try {
      await navigator.share({ title, url: publicUrl });
      track("share_native_used");
      posthog?.capture("share_native_used", { has_tournament: !!tournamentName });
    } catch {
      // User cancelled or share failed — silently no-op
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full sm:mx-4 animate-[sheet-up_0.3s_ease-out] sm:animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-6 pt-3 sm:pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 id={titleId} className="text-lg font-extrabold text-text-primary tracking-tight">
              {viewerMode ? "Share this report" : "Team shared!"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            {viewerMode
              ? "Copy the link or post it to social."
              : "Link copied to clipboard. Share it everywhere!"}
          </p>
        </div>

        {/* Thank you banner — shown when user just published the team */}
        {justPublished && (
          <div className="mx-6 mb-4 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-accent-surface/20 to-accent/5 p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-text-primary mb-0.5">
                  Thank you for sharing with the community!
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your report is now live on the Explore page. Every public team helps other players learn, build, and grow the VGC scene.
                </p>
                <button
                  type="button"
                  onClick={() => setJustPublished(false)}
                  className="mt-2 text-[11px] font-bold text-accent hover:underline cursor-pointer"
                >
                  Got it
                </button>
              </div>
              <button
                type="button"
                onClick={() => setJustPublished(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer flex-shrink-0"
                aria-label="Dismiss thank you message"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* URL display */}
        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-2 bg-surface-alt border border-border rounded-xl px-4 py-2.5 cursor-pointer hover:border-accent/40 transition-colors"
            onClick={handleCopyLink}
            role="button"
            tabIndex={0}
            aria-label="Copy link"
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCopyLink(); } }}
          >
            <span className="text-sm text-text-secondary truncate flex-1 font-[family-name:var(--font-mono)]">
              {displayUrl}
            </span>
            <span className="text-xs font-bold text-accent flex-shrink-0">
              {linkCopied ? "Copied!" : "Copy"}
            </span>
          </div>
          {!isShortUrl && (
            <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Link is long (server offline). Try sharing again for a short URL.
            </p>
          )}
        </div>

        {/* Social buttons — only shown for short URLs */}
        <div className={`px-6 pb-6 grid grid-cols-1 gap-2 ${!isShortUrl ? "opacity-40 pointer-events-none" : ""}`}>
          {/* Twitter/X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track("share_twitter_clicked");
              posthog?.capture("share_twitter_clicked", { has_tournament: !!tournamentName, has_placement: !!placement });
            }}
            className="flex items-center gap-3 px-4 py-3 bg-surface-alt border border-border rounded-xl hover:border-accent/40 hover:bg-accent-surface/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#000] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                Post on X / Twitter
              </div>
              <div className="text-xs text-text-tertiary truncate">
                Share with the VGC community
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>

          {/* Reddit */}
          <a
            href={redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track("share_reddit_clicked");
              posthog?.capture("share_reddit_clicked", { has_tournament: !!tournamentName });
            }}
            className="flex items-center gap-3 px-4 py-3 bg-surface-alt border border-border rounded-xl hover:border-accent/40 hover:bg-accent-surface/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#FF4500] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                Post on Reddit
              </div>
              <div className="text-xs text-text-tertiary truncate">
                Share to r/VGC
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>

          {/* Discord */}
          <button
            type="button"
            onClick={handleCopyDiscord}
            className="flex items-center gap-3 px-4 py-3 bg-surface-alt border border-border rounded-xl hover:border-accent/40 hover:bg-accent-surface/30 transition-all group cursor-pointer text-left w-full"
          >
            <div className="w-9 h-9 rounded-lg bg-[#5865F2] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="14" viewBox="0 0 24 18" fill="white">
                <path d="M20.317 1.492a19.7 19.7 0 0 0-4.885-1.516.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 1.492.07.07 0 0 0 3.642 1.52C.533 6.093-.319 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.227-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.02zM8.02 12.278c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                {discordCopied ? "Copied for Discord!" : "Copy for Discord"}
              </div>
              <div className="text-xs text-text-tertiary truncate">
                Formatted message with team preview
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>

          {/* Native share — shown only when the OS supports Web Share API (mobile/desktop with share support) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center gap-3 px-4 py-3 bg-surface-alt border border-border rounded-xl hover:border-accent/40 hover:bg-accent-surface/30 transition-all group cursor-pointer text-left w-full"
            >
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                  Share via…
                </div>
                <div className="text-xs text-text-tertiary truncate">
                  Discord DM, WhatsApp, Messages &amp; more
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>
          )}
        </div>

        {/* Embed snippet — only shown when a short /s/ URL is available */}
        {embedSnippet && (
          <div className="px-6 pb-6 border-t border-border pt-4">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
              Embed on your blog or forum
            </p>
            <div
              className="flex items-start gap-2 bg-surface-alt border border-border rounded-xl px-4 py-3 cursor-pointer hover:border-accent/40 transition-colors group"
              onClick={handleCopyEmbed}
              role="button"
              tabIndex={0}
              aria-label="Copy embed code"
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCopyEmbed(); } }}
            >
              <code className="text-[11px] text-text-secondary font-[family-name:var(--font-mono)] break-all flex-1 leading-relaxed select-all">
                {embedSnippet}
              </code>
              <span className="text-xs font-bold text-accent flex-shrink-0 group-hover:text-accent/80 transition-colors mt-0.5">
                {embedCopied ? "Copied!" : "Copy"}
              </span>
            </div>
            <p className="text-[11px] text-text-tertiary mt-2 leading-relaxed">
              Paste into any blog post, forum thread, or YouTube description. Includes a &ldquo;Powered by VGC Team Report&rdquo; link.
            </p>
          </div>
        )}

        {/* Public confirmation prompt — shown when sharing publicly, asks user to confirm */}
        {!viewerMode && isPublic && !publicConfirmDismissed && isOwner && (
          <div className={`mx-6 mb-4 rounded-xl border p-4 ${hasWarnings || !hasCreator || !hasTags ? "border-amber-500/30 bg-amber-500/5" : "border-accent/30 bg-accent-surface/20"}`}>
            {hasWarnings ? (
              <>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Fix warnings before publishing
                </p>
                <p className="text-xs text-text-secondary mb-1">
                  Your report has {warnings.length} warning{warnings.length > 1 ? "s" : ""}. Resolve them to publish on Explore. You can still share privately and collaborate.
                </p>
              </>
            ) : !hasCreator || !hasTags ? (
              <>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Almost ready to publish
                </p>
                <p className="text-xs text-text-secondary mb-1">
                  Public reports need {!hasCreator && !hasTags ? "an author name and at least one tag" : !hasCreator ? "an author name in the \"By\" field" : "at least one tag (regulation, event type, or archetype)"}. Add {!hasCreator && !hasTags ? "them" : "it"} and your team will appear on Explore.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  This report will be listed publicly
                </p>
                <p className="text-xs text-text-secondary mb-3">
                  Your team will appear on the Explore page for anyone to discover. Happy to share with the community?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPublicConfirmDismissed(true)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors cursor-pointer"
                  >
                    Yes, publish it
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleTogglePublic(false);
                      setPublicConfirmDismissed(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-alt transition-colors cursor-pointer"
                  >
                    Keep Private
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Visibility toggle — only owner can change; blocked when warnings exist.
            Hidden entirely in viewer mode since it's irrelevant to someone
            who's just sharing someone else's report. */}
        {!viewerMode && (
        <div className="px-6 py-4 border-t border-border">
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => isOwner && !hasWarnings && handleTogglePublic(!isPublic)}
            disabled={!isOwner || (hasWarnings && !isPublic)}
            className={`flex items-center gap-3 w-full text-left group ${isOwner && !(hasWarnings && !isPublic) ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          >
            <div className={`relative inline-flex h-[24px] w-[42px] items-center rounded-full transition-all duration-300 flex-shrink-0 ${
              isPublic ? "bg-accent shadow-md shadow-accent/30" : "bg-border"
            }`}>
              <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-300 ${
                isPublic ? "translate-x-[20px] scale-110" : "translate-x-[3px]"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                {isPublic ? "Listed on Explore" : "List on Explore"}
              </div>
              <div className="text-xs text-text-tertiary">
                {!isOwner
                  ? "Only the report owner can change visibility."
                  : hasWarnings && !isPublic
                  ? "Fix team warnings before publishing publicly."
                  : isPublic
                  ? "Your team is visible in the public gallery. Toggle off to unlist."
                  : "Currently unlisted. Toggle on to feature in the public gallery."}
              </div>
            </div>
            {isPublic && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-md tracking-wide bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                PUBLIC
              </span>
            )}
            {!isPublic && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-md tracking-wide bg-surface-alt text-text-tertiary border border-border">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                UNLISTED
              </span>
            )}
          </button>

          {/* Creator name error message */}
          {creatorError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                Add your name in the &quot;By&quot; field before publishing. Public reports need an author so the community knows who made it.
              </p>
            </div>
          )}

          {/* Tag error message */}
          {tagError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                Cannot publish to the public as there are no tags on this report. Add a regulation, event type, or archetype tag first.
              </p>
            </div>
          )}

          {/* Server-side publish error (e.g. 403 owner mismatch, 500, network) */}
          {publishError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  {publishError}
                </p>
                {onClearPublishError && (
                  <button
                    type="button"
                    onClick={onClearPublishError}
                    className="mt-1 text-[10px] font-semibold text-red-600/80 dark:text-red-400/80 hover:underline"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Comments toggle — only meaningful for the owner. Viewers can't
            persist this setting, so the toggle is hidden in viewer mode. */}
        {!viewerMode && (
        <div className="px-6 py-3 border-t border-border">
          <button
            type="button"
            role="switch"
            aria-checked={allowComments}
            onClick={() => onToggleComments(!allowComments)}
            className="flex items-center gap-3 w-full text-left group cursor-pointer"
          >
            <div className={`relative inline-flex h-[24px] w-[42px] items-center rounded-full transition-all duration-300 flex-shrink-0 ${
              allowComments ? "bg-accent shadow-md shadow-accent/30" : "bg-border"
            }`}>
              <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-300 ${
                allowComments ? "translate-x-[20px] scale-110" : "translate-x-[3px]"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                {allowComments ? "Comments enabled" : "Enable comments"}
              </div>
              <div className="text-xs text-text-tertiary">
                {allowComments
                  ? "Viewers can leave comments on your report."
                  : "Comments are off. Turn on to let others share feedback."}
              </div>
            </div>
          </button>
        </div>
        )}

        {/* Footer CTA */}
        <div className="px-6 py-4 bg-surface-alt/50 border-t border-border space-y-2.5">
          {/* The bookmark-edit-link warning only applies to the owner who
              just created/updated the share. A read-only viewer has no
              edit link to lose. */}
          {!viewerMode && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                <span className="font-bold text-text-primary">Bookmark this link now.</span> If you close the tab without saving it, you&apos;ll lose edit access to this report.
              </p>
            </div>
          )}
          <p className="text-xs text-text-tertiary text-center">
            The more you share, the more the VGC community grows.
            <br />
            <span className="font-semibold text-text-secondary">pokemonvgcteamreport.com</span>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
