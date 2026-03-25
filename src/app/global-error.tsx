"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#0B0B1A", color: "#F0EDE6", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
          <p style={{ color: "#7A7AA0", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            An unexpected error occurred. The error has been reported.
          </p>
          <button
            onClick={reset}
            style={{ background: "#E11D48", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "0.75rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
