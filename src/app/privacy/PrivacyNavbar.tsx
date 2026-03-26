"use client";

import { useDarkMode } from "@/hooks/useDarkMode";
import { PageNavbar } from "@/components/layout/PageNavbar";

export function PrivacyNavbar() {
  const { darkMode, setDarkMode } = useDarkMode();
  return <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} maxWidth="max-w-2xl" activePage="privacy" />;
}
