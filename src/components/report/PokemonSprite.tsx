"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getProgressiveSpriteUrls, isGenThemePixelated } from "@/lib/utils/sprite-url";
import { useTheme } from "@/hooks/useTheme";
import { useIsPrintMode } from "@/components/ui/print-context";

interface PokemonSpriteProps {
  species: string;
  size?: number;
  className?: string;
  /**
   * Opt in to the animated GIF. Off by default: progressive loading fetches a
   * static preview first, so animating costs a second, much larger request per
   * sprite. Only pass this for large hero/detail sprites where the animation is
   * the point — row icons and pickers stay on the cheap static preview.
   */
  animated?: boolean;
  shiny?: boolean;
  /** When true, sets fetchPriority="high" and loading="eager" for LCP optimization. */
  priority?: boolean;
}

/**
 * Decide where an <img> error moves the fallback chain.
 *
 * `showingAnimated` must describe what is actually rendered, not merely what
 * is held in state: an animated URL left over from a previous species/theme is
 * not on screen, so counting its error as the GIF's would consume the
 * preview's only error event and strand a permanently broken image instead of
 * walking on to the substitute sprite. Exported for tests.
 */
export function nextSpriteFallbackState(current: {
  /** Index into the static preview chain that is currently rendered. */
  urlIndex: number;
  /** Number of URLs in the preview chain. */
  urlCount: number;
  /** Animated URL held in state — possibly stale. */
  animatedSrc: string | null;
  /** Whether that animated URL is the one on screen. */
  showingAnimated: boolean;
}): { urlIndex: number; animatedSrc: string | null } {
  if (current.showingAnimated) {
    // The GIF failed. Drop it and show the static preview that already
    // loaded; the preview chain itself has not failed, so it keeps its place.
    return { urlIndex: current.urlIndex, animatedSrc: null };
  }
  // The preview on screen failed: advance exactly one step, and drop any
  // animated URL still held so it cannot swallow the next error.
  return {
    urlIndex: Math.min(current.urlIndex + 1, Math.max(current.urlCount - 1, 0)),
    animatedSrc: null,
  };
}

/**
 * Renders a Pokemon sprite that automatically adapts to the current
 * generation theme. Falls back through multiple sprite sources on error.
 * In print mode, forces static PNGs (GIFs don't render in PDF).
 */
export function PokemonSprite({
  species,
  size = 64,
  className = "",
  animated = false,
  shiny = false,
  priority = false,
}: PokemonSpriteProps) {
  const { genTheme } = useTheme();
  const isPrint = useIsPrintMode();
  const [urlIndex, setUrlIndex] = useState(0);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [animatedSrc, setAnimatedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // In print mode, force static sprites (GIFs don't render in PDF)
  const effectiveAnimated = isPrint ? false : animated;

  // Reset fallback index when inputs change
  useEffect(() => {
    setUrlIndex(0);
    setAnimatedSrc(null);
    // A cached preview can finish before hydration, so React never sees its
    // load event. Read the element's state instead of waiting for onLoad.
    const img = imgRef.current;
    setPreviewLoaded(Boolean(img?.complete && img.naturalWidth > 0));
  }, [species, shiny, effectiveAnimated, genTheme]);

  const progressiveUrls = useMemo(
    () => getProgressiveSpriteUrls(species, genTheme, shiny),
    [species, genTheme, shiny],
  );
  const urls = progressiveUrls.preview;

  // Once the small static preview is visible, fetch and decode the animated
  // sprite off-screen. Swapping to a decoded, cached URL is instantaneous and
  // avoids the blank-card delay users saw immediately after importing a team.
  useEffect(() => {
    if (!effectiveAnimated || isPrint || !previewLoaded || progressiveUrls.animated.length === 0) return;

    let cancelled = false;
    let candidate: HTMLImageElement | null = null;
    let index = 0;

    const tryNext = () => {
      if (cancelled || index >= progressiveUrls.animated.length) return;
      const url = progressiveUrls.animated[index++];
      candidate = new Image();
      candidate.decoding = "async";
      candidate.fetchPriority = priority ? "high" : "auto";
      candidate.onload = () => {
        if (!cancelled) setAnimatedSrc(url);
      };
      candidate.onerror = tryNext;
      candidate.src = url;
    };

    tryNext();
    return () => {
      cancelled = true;
      if (candidate) {
        candidate.onload = null;
        candidate.onerror = null;
      }
    };
  }, [effectiveAnimated, isPrint, previewLoaded, priority, progressiveUrls.animated]);

  const rawSrc = urls[Math.min(urlIndex, urls.length - 1)];
  // In print/export mode, route the sprite through our same-origin
  // /api/sprite proxy. html2canvas uses useCORS:true which forces
  // crossorigin="anonymous" on every image, and Showdown's CDN doesn't
  // send Access-Control-Allow-Origin, so the direct URLs fail to
  // decode during capture and the sprites blank out in the PNG export.
  // The proxy re-serves the bytes from our origin so CORS doesn't
  // apply. Non-print renders still use the CDN directly so we don't
  // pay the proxy round-trip during normal browsing.
  // Ignore an animated URL left over from the previous species/theme until the
  // reset effect clears it, so the old sprite never flashes for a frame.
  const liveAnimatedSrc =
    animatedSrc && progressiveUrls.animated.includes(animatedSrc) ? animatedSrc : null;
  const src = isPrint ? `/api/sprite?u=${encodeURIComponent(rawSrc)}` : (liveAnimatedSrc ?? rawSrc);
  const isGif = src.endsWith(".gif");
  const pixelated = isGenThemePixelated(genTheme) && !isGif;

  return (
    <img
      ref={imgRef}
      src={src}
      alt={species}
      width={size}
      height={size}
      loading={isPrint || priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`object-contain ${className}`}
      style={{
        maxWidth: size,
        maxHeight: size,
        ...(pixelated ? { imageRendering: "pixelated" as const } : {}),
      }}
      onError={() => {
        const next = nextSpriteFallbackState({
          urlIndex: Math.min(urlIndex, urls.length - 1),
          urlCount: urls.length,
          animatedSrc,
          showingAnimated: liveAnimatedSrc !== null,
        });
        setUrlIndex(next.urlIndex);
        setAnimatedSrc(next.animatedSrc);
      }}
      onLoad={() => {
        if (!liveAnimatedSrc) setPreviewLoaded(true);
      }}
    />
  );
}
