"use client";

import { Suspense } from "react";
import { I18nProvider } from "@/lib/i18n";
import { CompareContent } from "@/components/compare/CompareContent";

export default function ComparePage() {
  return (
    <I18nProvider>
      <Suspense>
        <CompareContent />
      </Suspense>
    </I18nProvider>
  );
}
