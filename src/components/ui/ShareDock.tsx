"use client";

import { useState, useEffect, useRef } from "react";
import { usePostHog } from "@/components/providers/PostHogProvider";
import { useScrollHide } from "@/hooks/useScrollHide";

interface ShareDockProps {
  publicUrl: string;
  teamSpecies: string[];
  tournamentName?: string;
  creatorName?: string;
  placement?: string;
}

/**
 * Persistent, low-profile share rail anchored bottom-center on shared
 * report views. The full ShareModal is still one tap away (Navbar ->
 * Share), but this dock removes the discovery cost: every viewer sees
 * the 4 share targets inline, no menu hunt, no modal.
 *
 * Auto-hides on scroll-down and reappears on scroll-up so it never
 * obscures slide content during a presentation. Always visible at
 * the top of the page so first-paint includes the CTA.
 */
export function ShareDock({
  publicUrl,
  teamSpecies,
  tournamentName,
  creatorName,
  placement,
}: ShareDockProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const posthog = usePostHog();
  const dockRef = useRef<HTMLDivElement>(null);
  const hidden = useScrollHide({ containerRef: dockRef });

  useEffect(() => {
    const nav = navigator as Navigator & { share?: unknown; canShare?: (data?: ShareData) => boolean };
    if (
      typeof navigator !== "undefined" &&
      typeof nav.share === "function" &&
      nav.canShare?.({ url: publicUrl })
    ) {
      setCanNativeShare(true);
    }
  }, [publicUrl]);

  const speciesText = teamSpecies.join(" / ");

  const teamTitle = tournamentName
    ? `${tournamentName}${placement ? ` (${placement})` : ""} VGC Team Report`
    : "VGC Team Report";

  const twitterText = tournamentName
    ? `Check out this ${tournamentName}${placement ? ` (${placement})` : ""} VGC team report: ${speciesText}\n\n${publicUrl}\n\n#PokemonChampions #VGC2026\nMade with @VGCTeamReport`
    : `Check out this VGC team report: ${speciesText}\n\n${publicUrl}\n\n#PokemonChampions #VGC2026\nMade with @VGCTeamReport`;

  const redditTitle = tournamentName
    ? `[Team Report] ${tournamentName}${placement ? ` - ${placement}` : ""}: ${speciesText}`
    : `[Team Report] ${speciesText}`;

  const discordText = tournamentName
    ? `**${tournamentName}**${placement ? ` (${placement})` : ""}${creatorName ? ` by ${creatorName}` : ""}\n${speciesText}\n${publicUrl}`
    : `**VGC Team Report**${creatorName ? ` by ${creatorName}` : ""}\n${speciesText}\n${publicUrl}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
  const redditUrl = `https://www.reddit.com/r/VGC/submit?type=link&title=${encodeURIComponent(redditTitle)}&url=${encodeURIComponent(publicUrl)}`;

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: teamTitle, url: publicUrl });
      posthog?.capture("share_dock_action", { action: "native_share" });
    } catch {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
      posthog?.capture("share_dock_action", { action: "copy_link" });
    } catch {
      // Clipboard may be blocked
    }
  };

  const handleCopyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(discordText);
      setDiscordCopied(true);
      setTimeout(() => setDiscordCopied(false), 1800);
      posthog?.capture("share_dock_action", { action: "discord_copy" });
    } catch {
      // Same - clipboard permissions vary by browser
    }
  };

  return (
    <div
      ref={dockRef}
      className={`fixed left-1/2 -translate-x-1/2 z-40 top-[calc(env(safe-area-inset-top,0px)+64px)] sm:top-[72px] transition-transform duration-300 motion-reduce:transition-none ${
        hidden ? "-translate-y-[140%]" : "translate-y-0"
      }`}
      role="region"
      aria-label="Share this report"
    >
      <div className="flex items-center gap-1.5 bg-surface/95 backdrop-blur-md border border-border shadow-xl shadow-black/20 rounded-full px-2 py-1.5">
        <span className="hidden sm:inline px-3 text-[11px] font-extrabold uppercase tracking-wider text-text-tertiary">
          Share
        </span>

        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="h-11 inline-flex items-center gap-1.5 px-3 rounded-full bg-accent text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm shadow-accent/30 sm:hidden"
            aria-label="Share via device"
            title="Share via device"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share
          </button>
        )}

        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-alt active:scale-95 transition-all"
          aria-label="Share on X / Twitter"
          title="Share on X / Twitter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        <a
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-alt active:scale-95 transition-all"
          aria-label="Share on Reddit"
          title="Share to r/VGC"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#FF4500]">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
        </a>

        <button
          type="button"
          onClick={handleCopyDiscord}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-alt active:scale-95 transition-all cursor-pointer relative"
          aria-label={discordCopied ? "Discord message copied" : "Copy Discord message"}
          title={discordCopied ? "Copied!" : "Copy formatted Discord message"}
        >
          {discordCopied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 18" fill="currentColor" className="text-[#5865F2]">
              <path d="M20.317 1.492a19.7 19.7 0 0 0-4.885-1.516.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 1.492.07.07 0 0 0 3.642 1.52C.533 6.093-.319 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.227-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.02zM8.02 12.278c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="h-11 inline-flex items-center gap-1.5 px-3 rounded-full bg-accent text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer ml-0.5 shadow-sm shadow-accent/30"
          aria-label={linkCopied ? "Link copied" : "Copy link"}
        >
          {linkCopied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
