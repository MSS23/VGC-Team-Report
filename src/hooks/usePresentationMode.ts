"use client";

import { useState, useEffect, useCallback } from "react";

export function usePresentationMode() {
  const [presentationMode, setPresentationMode] = useState(false);

  // Set data attribute on <html> for CSS variant
  useEffect(() => {
    if (presentationMode) {
      document.documentElement.setAttribute("data-presentation-mode", "");
    } else {
      document.documentElement.removeAttribute("data-presentation-mode");
    }
  }, [presentationMode]);

  // Fullscreen API integration
  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {
      // Fullscreen not supported or blocked — presentation mode still works
    });
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Auto-fullscreen when entering/exiting presentation mode
  useEffect(() => {
    if (presentationMode) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  }, [presentationMode, enterFullscreen, exitFullscreen]);

  // Sync state when user exits fullscreen via Escape
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && presentationMode) {
        setPresentationMode(false);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [presentationMode]);

  // F5 keyboard shortcut to toggle presentation mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        setPresentationMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { presentationMode, setPresentationMode };
}
