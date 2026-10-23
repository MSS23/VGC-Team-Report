"use client";

import { useTranslation } from "@/lib/i18n";

export function ExploreHero() {
  const { t } = useTranslation();

  return (
    <div className="pt-10 pb-12 sm:pt-16 sm:pb-16">
      <h1 className="font-display text-display-s font-bold tracking-display text-text-primary">
        Best VGC Teams 2026
      </h1>
      <p className="lead mt-5 text-text-secondary">
        {t.exploreSubtitle}
      </p>
    </div>
  );
}
