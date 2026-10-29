"use client";

import { useState, useEffect } from "react";
import { getSessionId } from "@/lib/utils/session-id";

export function useSessionId(): string {
  const [id, setId] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session id lives in browser storage; reading it in render would break hydration
    setId(getSessionId());
  }, []);
  return id;
}
