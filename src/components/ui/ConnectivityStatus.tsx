"use client";

import { useState, useEffect, useRef } from "react";

export function ConnectivityStatus() {
  const [status, setStatus] = useState<"online" | "offline" | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef(true);

  useEffect(() => {
    const show = (nextStatus: "online" | "offline") => {
      // Don't show on initial page load — only on transitions
      if (initialRef.current) {
        initialRef.current = false;
        return;
      }
      setStatus(nextStatus);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), nextStatus === "online" ? 3000 : 8000);
    };

    const goOffline = () => show("offline");
    const goOnline = () => show("online");

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Mark initial state observed
    initialRef.current = true;

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible || !status) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[80] safe-top transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-lg text-sm font-bold backdrop-blur-xl ${
        status === "offline"
          ? "bg-red-950/90 text-red-200 border border-red-500/30"
          : "bg-emerald-950/90 text-emerald-200 border border-emerald-500/30"
      }`}>
        {status === "offline" ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0122.56 9"/>
              <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            You&apos;re offline
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Back online
          </>
        )}
      </div>
    </div>
  );
}
