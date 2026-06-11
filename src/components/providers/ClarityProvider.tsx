"use client";

import { useEffect } from "react";

export function ClarityProvider() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!id) return;

    import("@microsoft/clarity").then(({ default: Clarity }) => Clarity.init(id));
  }, []);

  return null;
}
