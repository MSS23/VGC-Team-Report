"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ShareModalProps {
  publicUrl: string;
  teamSpecies: string[];
  tournamentName?: string;
  creatorName?: string;
  placement?: string;
  isPublic: boolean;
  onTogglePublic: (v: boolean) => void;
  allowComments: boolean;
  onToggleComments: (v: boolean) => void;
  onClose: () => void;
}

export function ShareModal({
  publicUrl,
  teamSpecies,
  tournamentName,
  creatorName,
  placement,
  isPublic,
  onTogglePublic,
  allowComments,
  onToggleComments,
  onClose,
}: ShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Detect if this is a short DB-backed URL or the long fallback
  const isShortUrl = publicUrl.includes("/s/") && !publicUrl.includes("#data=");
  const displayUrl = isShortUrl
    ? publicUrl
    : publicUrl.replace(/^https?:\/\//, "").split("#")[0] + "/...";

  const speciesText = teamSpecies.join(" / ");

  // Build share text variants (only useful with short URLs)
  const twitterText = tournamentName
    ? `Check out my ${tournamentName}${placement ? ` (${placement})` : ""} VGC team report: ${speciesText}\n\n${publicUrl}\n\nMade with @VGCTeamReport`
    : `Check out my VGC team report: ${speciesText}\n\n${publicUrl}\n\nMade with @VGCTeamReport`;

  const redditTitle = tournamentName
    ? `[Team Report] ${tournamentName}${placement ? ` - ${placement}` : ""}: ${speciesText}`
    : `[Team Report] ${speciesText}`;

  const discordText = tournamentName
    ? `**${tournamentName}**${placement ? ` (${placement})` : ""}${creatorName ? ` by ${creatorName}` : ""}\n${speciesText}\n${publicUrl}`
    : `**VGC Team Report**${creatorName ? ` by ${creatorName}` : ""}\n${speciesText}\n${publicUrl}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
  const redditUrl = `https://www.reddit.com/r/VGC/submit?type=link&title=${encodeURIComponent(redditTitle)}&url=${encodeURIComponent(publicUrl)}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCopyDiscord = async () => {
    await navigator.clipboard.writeText(discordText);
    setDiscordCopied(true);
    setTimeout(() => setDiscordCopied(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full sm:mx-4 animate-[sheet-up_0.3s_ease-out] sm:animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-6 pt-3 sm:pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
              Team shared!
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            Link copied to clipboard. Share it everywhere!
          </p>
        </div>

        {/* URL display */}
        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-2 bg-surface-alt border border-border rounded-xl px-4 py-2.5 cursor-pointer hover:border-accent/40 transition-colors"
            onClick={handleCopyLink}
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
        </div>

        {/* Visibility toggle */}
        <div className="px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={() => onTogglePublic(!isPublic)}
            className="flex items-center gap-3 w-full text-left group cursor-pointer"
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
                {isPublic
                  ? "Your team is visible in the public gallery. Toggle off to unlist."
                  : "Currently unlisted. Toggle on to feature in the public gallery."}
              </div>
            </div>
            {isPublic && (
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-md tracking-wide bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                PUBLIC
              </span>
            )}
            {!isPublic && (
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold rounded-md tracking-wide bg-surface-alt text-text-tertiary border border-border">
                UNLISTED
              </span>
            )}
          </button>
        </div>

        {/* Comments toggle */}
        <div className="px-6 py-3 border-t border-border">
          <button
            type="button"
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

        {/* Footer CTA */}
        <div className="px-6 py-4 bg-surface-alt/50 border-t border-border">
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
