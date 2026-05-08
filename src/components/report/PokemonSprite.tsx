"use client";

import { useState, useEffect, useMemo } from "react";
import { getGenThemedSpriteUrls, isGenThemePixelated } from "@/lib/utils/sprite-url";
import { useTheme } from "@/hooks/useTheme";
import { useIsPrintMode } from "@/components/ui/print-context";

interface PokemonSpriteProps {
  species: string;
  size?: number;
  className?: string;
  animated?: boolean;
  shiny?: boolean;
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
}: PokemonSpriteProps) {
  const { genTheme } = useTheme();
  const isPrint = useIsPrintMode();
  const [urlIndex, setUrlIndex] = useState(0);

  // In print mode, force static sprites (GIFs don't render in PDF)
  const effectiveAnimated = isPrint ? false : animated;

  // Reset fallback index when inputs change
  useEffect(() => {
    setUrlIndex(0);
  }, [species, shiny, effectiveAnimated, genTheme]);

  const urls = useMemo(
    () => getGenThemedSpriteUrls(species, genTheme, effectiveAnimated, shiny),
    [species, genTheme, effectiveAnimated, shiny],
  );

  const rawSrc = urls[Math.min(urlIndex, urls.length - 1)];
  // In print/export mode, route the sprite through our same-origin
  // /api/sprite proxy. html2canvas uses useCORS:true which forces
  // crossorigin="anonymous" on every image, and Showdown's CDN doesn't
  // send Access-Control-Allow-Origin — so the direct URLs fail to
  // decode during capture and the sprites blank out in the PNG export.
  // The proxy re-serves the bytes from our origin so CORS doesn't
  // apply. Non-print renders still use the CDN directly so we don't
  // pay the proxy round-trip during normal browsing.
  const src = isPrint ? `/api/sprite?u=${encodeURIComponent(rawSrc)}` : rawSrc;
  const isGif = rawSrc.endsWith(".gif");
  const pixelated = isGenThemePixelated(genTheme) && !isGif;

  return (
    <img
      src={src}
      alt={species}
      width={size}
      height={size}
      loading={isPrint ? "eager" : "lazy"}
      className={`object-contain ${className}`}
      style={{
        maxWidth: size,
        maxHeight: size,
        ...(pixelated ? { imageRendering: "pixelated" as const } : {}),
      }}
      onError={() => {
        setUrlIndex((prev) => Math.min(prev + 1, urls.length - 1));
      }}
    />
  );
}
