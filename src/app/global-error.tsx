"use client";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Exceptions are captured app-wide by PostHog's error tracking, so this
  // boundary only needs to render a recoverable fallback UI.
  return (
    <html lang="en">
      <head>
        <style>{`:root { --night: #0B0B1A; --dark-ink: #F0EDE6; --dark-muted: #7A7AA0; --accent: #E11D48; --accent-ink: #FFFFFF; } html, body { overflow-x: clip; }`}</style>
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", background: "var(--night)", color: "var(--dark-ink)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", margin: 0 }}>
        <div role="alert" aria-live="assertive" style={{ textAlign: "center", maxWidth: 400 }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
          <p style={{ color: "var(--dark-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            An unexpected error occurred. The error has been reported.
          </p>
          <button
            onClick={reset}
            style={{ background: "var(--accent)", color: "var(--accent-ink)", border: "none", padding: "0.75rem 1.5rem", borderRadius: "0.75rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
