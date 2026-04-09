"use client";

import { useTranslation } from "@/lib/i18n";

export function ExploreHero() {
  const { t } = useTranslation();

  return (
    <div className="pt-3 sm:pt-10 pb-2 sm:pb-6 text-center">
      <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">
        {t.exploreTitle.replace("VGC Teams", "")}{" "}
        <span className="text-accent">VGC Teams</span>
      </h1>
      <p className="mt-1 text-text-secondary text-xs sm:text-sm max-w-md mx-auto hidden sm:block">
        {t.exploreSubtitle}
      </p>
    </div>
  );
}
