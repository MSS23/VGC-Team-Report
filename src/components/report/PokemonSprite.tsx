"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getProgressiveSpriteUrls, isGenThemePixelated } from "@/lib/utils/sprite-url";
import { useTheme } from "@/hooks/useTheme";
import { useIsPrintMode } from "@/components/ui/print-context";

interface PokemonSpriteProps {
  species: string;
  size?: number;
  className?: string;
  animated?: boolean;
  shiny?: boolean;
  /** When true, sets fetchPriority="high" and loading="eager" for LCP optimization. */
  priority?: boolean;
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
  animated = true,
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
        if (animatedSrc) {
          setAnimatedSrc(null);
          return;
        }
        setUrlIndex((prev) => Math.min(prev + 1, urls.length - 1));
      }}
      onLoad={() => {
        if (!liveAnimatedSrc) setPreviewLoaded(true);
      }}
    />
  );
}
