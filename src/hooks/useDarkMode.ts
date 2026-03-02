"use client";

import { useState, useEffect } from "react";

export function useDarkMode(defaultDark = false) {
  const [darkMode, setDarkMode] = useState(defaultDark);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-dark-mode", "");
    } else {
      document.documentElement.removeAttribute("data-dark-mode");
    }
  }, [darkMode]);

  return { darkMode, setDarkMode };
}
