"use client";

import { useState, useRef } from "react";

const BASE = "https://play.pokemonshowdown.com/sprites/itemicons";

// Showdown returns a default pokeball placeholder (~3800 bytes) for unknown items
// instead of a 404. We detect this by checking file size via naturalWidth/Height.
// The placeholder is 40x40 but real item icons are 24x24.
const PLACEHOLDER_SIZE = 40;

function toItemSlug(item: string): string {
  return item
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
}

interface ItemIconProps {
  item: string;
  size?: number;
  className?: string;
}

export function ItemIcon({ item, size = 24, className = "" }: ItemIconProps) {
  const [showText, setShowText] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  if (showText) {
    return null;
  }

  return (
    <img
      ref={imgRef}
      src={`${BASE}/${toItemSlug(item)}.png`}
      alt={item}
      title={item}
      width={size}
      height={size}
      loading="lazy"
      className={`object-contain inline-block ${className}`}
      style={{ maxWidth: size, maxHeight: size }}
      onLoad={() => {
        // Detect the Showdown placeholder (40x40 pokeball)
        const img = imgRef.current;
        if (img && img.naturalWidth === PLACEHOLDER_SIZE && img.naturalHeight === PLACEHOLDER_SIZE) {
          setShowText(true);
        }
      }}
      onError={() => setShowText(true)}
    />
  );
}
