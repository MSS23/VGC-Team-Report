"use client";

import { useState, useEffect } from "react";
import { getSessionId } from "@/lib/utils/session-id";

export function useSessionId(): string {
  const [id, setId] = useState("");
  useEffect(() => {
    setId(getSessionId());
  }, []);
  return id;
}
