"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function useIsSharePage() {
  const pathname = usePathname();
  const [hasShareParam, setHasShareParam] = useState(false);

  useEffect(() => {
    setHasShareParam(new URLSearchParams(window.location.search).has("s"));
  }, [pathname]);

  return pathname?.startsWith("/s/") || hasShareParam;
}

export function ConnectivityStatus() {
  const [status, setStatus] = useState<"online" | "offline" | null>(null);
  const [visible, setVisible] = useState(false);
  const [persistOffline, setPersistOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef(true);
  const isSharePage = useIsSharePage();

  useEffect(() => {
    const show = (nextStatus: "online" | "offline") => {
      // Don't show on initial page load — only on transitions
      if (initialRef.current) {
        initialRef.current = false;
        // But if we load offline on a share page, show persistent banner
        if (nextStatus === "offline") {
          setPersistOffline(true);
        }
        return;
      }
      setStatus(nextStatus);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);

      if (nextStatus === "offline") {
        setPersistOffline(true);
        // Still auto-hide the toast after 8s — persistent banner takes over on share pages
        timerRef.current = setTimeout(() => setVisible(false), 8000);
      } else {
        setPersistOffline(false);
        timerRef.current = setTimeout(() => setVisible(false), 3000);
      }
    };

    const goOffline = () => show("offline");
    const goOnline = () => show("online");

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Check initial state for offline share page scenario
    if (!navigator.onLine) {
      setPersistOffline(true);
    }

    // Mark initial state observed
    initialRef.current = true;

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = visible && status;
  const showCachedBanner = persistOffline && isSharePage;

  return (
    <>
      {/* Transient online/offline toast */}
      {showToast && (
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
      )}

      {/* Persistent cached-version banner for share pages viewed offline */}
      {showCachedBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] safe-bottom animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg text-xs font-semibold backdrop-blur-xl bg-amber-950/90 text-amber-200 border border-amber-500/30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Offline — viewing cached version
          </div>
        </div>
      )}
    </>
  );
}
