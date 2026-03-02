"use client";

import { useState, useEffect } from "react";
import { getSpriteUrl, getSpriteFallbackUrl } from "@/lib/utils/sprite-url";
import type { SpriteVariant } from "@/lib/utils/sprite-url";

interface PokemonSpriteProps {
  species: string;
  size?: number;
  className?: string;
  variant?: SpriteVariant;
  shiny?: boolean;
}

/**
 * Fallback chain: ani → gen5 static → substitute
 * ani has modern animated GIFs for ALL Pokémon (consistent style).
 * gen5 has static PNGs as a last resort.
 */
type FallbackStage = "primary" | "static" | "substitute";

export function PokemonSprite({
  species,
  size = 64,
  className = "",
  variant = "ani",
  shiny = false,
}: PokemonSpriteProps) {
  const [fallback, setFallback] = useState<FallbackStage>("primary");

  // Reset fallback when species or shiny changes so reordered Pokemon retry the GIF
  useEffect(() => {
    setFallback("primary");
  }, [species, shiny]);

  let src: string;
  let isAnimated = false;

  switch (fallback) {
    case "primary":
      src = getSpriteUrl(species, variant, shiny);
      isAnimated = variant !== "gen5";
      break;
    case "static":
      src = getSpriteUrl(species, "gen5", shiny);
      break;
    case "substitute":
      src = getSpriteFallbackUrl("gen5");
      break;
  }

  return (
    <img
      src={src}
      alt={species}
      width={size}
      height={size}
      loading="lazy"
      className={`${isAnimated ? "" : "pixelated"} object-contain ${className}`}
      style={isAnimated ? { maxWidth: size, maxHeight: size } : { imageRendering: "pixelated", maxWidth: size, maxHeight: size }}
      onError={() => {
        setFallback((prev) => {
          if (prev === "primary") return "static";
          return "substitute";
        });
      }}
    />
  );
}
