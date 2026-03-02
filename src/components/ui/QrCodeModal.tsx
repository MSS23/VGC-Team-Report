"use client";

import { useEffect, useState } from "react";

interface QrCodeModalProps {
  url: string;
  onDismiss: () => void;
}

export function QrCodeModal({ url, onDismiss }: QrCodeModalProps) {
  const [svgData, setSvgData] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.toString(url, {
        type: "svg",
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then((svg) => {
        if (!cancelled) setSvgData(svg);
      });
    });
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onDismiss}
    >
      <div
        className="bg-surface border border-border rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Scan to View Team
        </h3>
        <div className="bg-white p-3 rounded-xl">
          {svgData ? (
            <div dangerouslySetInnerHTML={{ __html: svgData }} />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <p className="text-xs text-text-tertiary text-center">
          Share URL copied to clipboard
        </p>
        <button
          onClick={onDismiss}
          className="px-4 py-2 bg-surface-alt border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
