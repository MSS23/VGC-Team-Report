"use client";

import { useCallback, useRef } from "react";
import type { TeamAnalysis } from "@/lib/types/analysis";
import { teamToShowdown } from "@/lib/utils/export-paste";
import { exportAsImage, exportAsPdf } from "@/lib/utils/export-report";

interface ExportOptions {
  analysis: TeamAnalysis | null;
  tournamentName?: string;
  physicalSlide: number;
}

export function useExportActions({ analysis, tournamentName, physicalSlide }: ExportOptions) {
  const slideContentRef = useRef<HTMLDivElement>(null);

  const handleExportTeam = useCallback(() => {
    if (!analysis) return;
    const pasteText = teamToShowdown(analysis.pokemon.map((p) => p.parsed));
    navigator.clipboard.writeText(pasteText);
  }, [analysis]);

  const handleExportImage = useCallback(async () => {
    if (!slideContentRef.current || !analysis) return;
    const name = tournamentName
      ? `${tournamentName}-slide-${physicalSlide + 1}`
      : `vgc-report-slide-${physicalSlide + 1}`;
    await exportAsImage(slideContentRef.current, name);
  }, [analysis, tournamentName, physicalSlide]);

  const handleExportPdf = useCallback(async () => {
    if (!slideContentRef.current || !analysis) return;
    const name = tournamentName
      ? `${tournamentName}-slide-${physicalSlide + 1}`
      : `vgc-report-slide-${physicalSlide + 1}`;
    await exportAsPdf(slideContentRef.current, name);
  }, [analysis, tournamentName, physicalSlide]);

  return { slideContentRef, handleExportTeam, handleExportImage, handleExportPdf };
}
