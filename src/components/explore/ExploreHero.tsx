"use client";

import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";

const SHOWCASE_SPRITES = [
  "incineroar", "flutter-mane", "rillaboom", "urshifu-rapid-strike",
  "calyrex-ice", "tornadus-therian", "ogerpon-hearthflame", "iron-hands",
];

const BASE_URL = "https://play.pokemonshowdown.com/sprites";

function spriteUrl(slug: string) {
  // Use simpler slug resolution for showcase (these are known-good slugs)
  const resolved = slug.replace(/-/g, "");
  return `${BASE_URL}/gen5ani/${resolved}.gif`;
}

export function ExploreHero() {
  const { t } = useTranslation();

  return (
    <div className="relative pt-12 sm:pt-16 pb-8 sm:pb-10 text-center overflow-hidden">
      {/* Floating sprites background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07] overflow-hidden" aria-hidden>
        {SHOWCASE_SPRITES.map((slug, i) => (
          <motion.img
            key={slug}
            src={spriteUrl(slug)}
            alt=""
            className="absolute w-16 h-16 sm:w-20 sm:h-20 object-contain"
            style={{
              left: `${10 + (i % 4) * 22}%`,
              top: `${i < 4 ? 10 : 55}%`,
              imageRendering: "pixelated",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: [0, -8, 0],
            }}
            transition={{
              opacity: { delay: 0.2 + i * 0.1, duration: 0.5 },
              y: {
                delay: 0.5 + i * 0.15,
                duration: 3 + (i % 3),
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              },
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          {t.exploreTitle.replace("VGC Teams", "")}{" "}
          <span className="text-accent">VGC Teams</span>
        </h1>
        <p className="mt-3 text-text-secondary text-sm sm:text-base max-w-lg mx-auto">
          {t.exploreSubtitle}
        </p>
      </motion.div>
    </div>
  );
}
