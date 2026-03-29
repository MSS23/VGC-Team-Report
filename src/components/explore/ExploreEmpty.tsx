"use client";

import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";

const SUBSTITUTE_URL =
  "https://play.pokemonshowdown.com/sprites/gen5/substitute.png";

export function ExploreEmpty({ hasSearch }: { hasSearch: boolean }) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <img
        src={SUBSTITUTE_URL}
        alt=""
        width={80}
        height={80}
        className="opacity-30 mb-6"
        style={{ imageRendering: "pixelated" }}
      />
      <h3 className="text-lg font-bold text-text-primary mb-2">
        {hasSearch ? t.noSearchResults : t.noPublicReports}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm">
        {hasSearch
          ? t.tryDifferentSearch
          : t.beTheFirst}
      </p>
      {!hasSearch && (
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide"
        >
          {t.buildYourOwn}
        </a>
      )}
    </motion.div>
  );
}
