"use client";

import { useState } from "react";

const BASE = "https://play.pokemonshowdown.com/sprites/itemicons";

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
  const [failed, setFailed] = useState(false);
  const slug = toItemSlug(item);

  if (failed) {
    return (
      <span className={`text-xs text-text-primary font-medium ${className}`}>
        {item}
      </span>
    );
  }

  return (
    <img
      src={`${BASE}/${slug}.png`}
      alt={item}
      title={item}
      width={size}
      height={size}
      loading="lazy"
      className={`object-contain inline-block ${className}`}
      style={{ maxWidth: size, maxHeight: size }}
      onError={() => setFailed(true)}
    />
  );
}
