"use client";

import { useState, useEffect } from "react";

export function useCreatorMode() {
  const [creatorMode, setCreatorMode] = useState(false);

  useEffect(() => {
    if (creatorMode) {
      document.documentElement.setAttribute("data-creator-mode", "");
    } else {
      document.documentElement.removeAttribute("data-creator-mode");
    }
  }, [creatorMode]);

  return { creatorMode, setCreatorMode };
}
