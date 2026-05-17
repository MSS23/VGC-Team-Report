"use client";

import { useState, useId, useRef } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const errorId = `${uid}-error`;
  const inputId = `${uid}-email`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-1.5 py-4 px-5 rounded-2xl bg-surface-alt border border-border animate-fade-in text-center">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 mb-0.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-text-primary">You&apos;re in! Check your inbox.</p>
        <p className="text-xs text-text-secondary">Weekly VGC meta updates are on the way.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-alt border border-border px-5 py-4">
      <p className="text-sm font-semibold text-text-primary mb-0.5">
        Get the weekly VGC meta update
      </p>
      <p className="text-xs text-text-secondary mb-3">No spam. Unsubscribe anytime.</p>

      <form onSubmit={handleSubmit} noValidate aria-label="Newsletter signup">
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") {
                setStatus("idle");
                setErrorMsg("");
              }
            }}
            disabled={status === "loading"}
            aria-describedby={errorMsg ? errorId : undefined}
            aria-invalid={status === "error" ? "true" : undefined}
            className="
              flex-1 min-h-[44px] rounded-xl border border-border bg-surface
              px-3.5 text-sm text-text-primary placeholder:text-text-tertiary
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50
              disabled:opacity-60 transition-colors
            "
          />
          <button
            type="submit"
            disabled={status === "loading" || !email.trim()}
            className="
              min-h-[44px] px-5 rounded-xl bg-accent text-white text-sm font-bold
              hover:brightness-110 active:scale-[0.97] transition-all duration-150
              shadow-md shadow-accent/25 disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1
              whitespace-nowrap
            "
            aria-label={status === "loading" ? "Subscribing…" : "Subscribe to newsletter"}
          >
            {status === "loading" ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="animate-spin"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Subscribing…
              </span>
            ) : (
              "Subscribe"
            )}
          </button>
        </div>

        {status === "error" && errorMsg && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 text-xs text-red-500 dark:text-red-400"
          >
            {errorMsg}
          </p>
        )}
      </form>
    </div>
  );
}
