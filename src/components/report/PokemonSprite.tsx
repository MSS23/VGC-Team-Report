"use client";

import { useState, useEffect, useMemo } from "react";
import { getGenThemedSpriteUrls, isGenThemePixelated } from "@/lib/utils/sprite-url";
import { SHOWDOWN_SUBSTITUTE_URL } from "@/lib/utils/sprite-fallback";
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

  // In print mode, force static sprites (GIFs don't render in PDF)
  const effectiveAnimated = isPrint ? false : animated;

  // Reset fallback index when inputs change
  useEffect(() => {
    setUrlIndex(0);
  }, [species, shiny, effectiveAnimated, genTheme]);

  // VGC-232: terminal link of the chain. The proxy walks the full
  // server-side fallback chain (Showdown HOME -> PokemonDB HOME -> gen5 ->
  // substitute -> inline SVG) with per-CDN forme normalisation, so formes
  // Showdown spells differently from the paste — Ash-Greninja, Zygarde-10%,
  // Sirfetch'd — resolve to a real sprite instead of the substitute doll.
  const proxySrc = useMemo(() => {
    const p = new URLSearchParams({ species });
    if (effectiveAnimated) p.set("animated", "1");
    if (shiny) p.set("shiny", "1");
    return `/api/sprite?${p.toString()}`;
  }, [species, effectiveAnimated, shiny]);

  const urls = useMemo(
    () => [
      // Drop the CDN chain's own substitute terminal: it returns 200, so
      // onError never fires and we'd stop on the doll without ever asking
      // the proxy. The proxy has its own guaranteed-renderable terminal.
      ...getGenThemedSpriteUrls(species, genTheme, effectiveAnimated, shiny).filter(
        (u) => u !== SHOWDOWN_SUBSTITUTE_URL,
      ),
      proxySrc,
    ],
    [species, genTheme, effectiveAnimated, shiny, proxySrc],
  );

  const rawSrc = urls[Math.min(urlIndex, urls.length - 1)] ?? proxySrc;
  const isFallbackProxy = rawSrc === proxySrc;
  // In print/export mode, route the sprite through our same-origin
  // /api/sprite proxy. html2canvas uses useCORS:true which forces
  // crossorigin="anonymous" on every image, and Showdown's CDN doesn't
  // send Access-Control-Allow-Origin — so the direct URLs fail to
  // decode during capture and the sprites blank out in the PNG export.
  // The proxy re-serves the bytes from our origin so CORS doesn't
  // apply. Non-print renders still use the CDN directly so we don't
  // pay the proxy round-trip during normal browsing — the proxy is only
  // reached once the direct CDN links have actually 404'd.
  const src =
    isPrint && !isFallbackProxy
      ? `/api/sprite?u=${encodeURIComponent(rawSrc)}&species=${encodeURIComponent(species)}`
      : rawSrc;
  const isGif = rawSrc.endsWith(".gif");
  // The proxy resolves to a modern HOME render, which shouldn't be
  // pixel-scaled even under a retro gen theme.
  const pixelated = isGenThemePixelated(genTheme) && !isGif && !isFallbackProxy;

  return (
    <img
      src={src}
      alt={species}
      width={size}
      height={size}
      loading={isPrint || priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
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
