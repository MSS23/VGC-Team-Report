"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { getSessionId } from "@/lib/utils/session-id";

const TYPES = [
  { value: "feature", label: "Feature Request", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", color: "text-emerald-500 bg-emerald-500/10" },
  { value: "bug", label: "Bug Report", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01", color: "text-red-500 bg-red-500/10" },
  { value: "improvement", label: "Improvement", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8", color: "text-amber-500 bg-amber-500/10" },
  { value: "other", label: "Other", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", color: "text-blue-500 bg-blue-500/10" },
] as const;

function detectDevice(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Edg/i.test(ua)) return "Edge";
  return "Other";
}

function detectScreenSize(): string {
  if (typeof window === "undefined") return "Unknown";
  return `${window.innerWidth}x${window.innerHeight}`;
}

export function FeedbackContent() {
  return (
    <I18nProvider>
      <FeedbackInner />
    </I18nProvider>
  );
}

function FeedbackInner() {
  const { darkMode, setDarkMode } = useDarkMode();
  useEffect(() => { applyRandomAccent(); }, []);

  const [type, setType] = useState<string>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ device: "...", browser: "...", screen: "..." });

  // Detect device info on mount (avoids hydration mismatch)
  useEffect(() => {
    setDeviceInfo({
      device: detectDevice(),
      browser: detectBrowser(),
      screen: detectScreenSize(),
    });
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          device: detectDevice(),
          browser: detectBrowser(),
          screenSize: detectScreenSize(),
          contact: contact.trim() || undefined,
          sessionId: getSessionId(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/90 border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold text-sm hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="text-text-primary">VGC Team</span>
            <span className="text-accent">Report</span>
          </a>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {submitted ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Thank you!</h1>
            <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
              Your feedback has been submitted. We review every submission and use it to improve VGC Team Report.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a href="/" className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                Back to Home
              </a>
              <button
                onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); setContact(""); }}
                className="px-5 py-2.5 text-sm font-bold text-text-secondary bg-surface border-2 border-border hover:border-accent/30 rounded-xl transition-all cursor-pointer"
              >
                Submit Another
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Help Us Improve
            </h1>
            <p className="text-sm text-text-secondary mb-8">
              Request a feature, report a bug, or suggest an improvement. Your device and browser info is auto-detected to help us reproduce issues.
            </p>

            {/* Type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    type === t.value
                      ? "border-accent bg-accent-surface/50 shadow-sm"
                      : "border-border hover:border-accent/30 bg-surface"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.color}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={t.icon} />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold ${type === t.value ? "text-accent" : "text-text-secondary"}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Title */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Title <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === "bug" ? "What went wrong?" : type === "feature" ? "What feature would you like?" : "Brief summary"}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Description <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                    placeholder={
                      type === "bug"
                        ? "Steps to reproduce:\n1. Go to...\n2. Click on...\n3. See error...\n\nExpected behavior:\nWhat should have happened\n\nActual behavior:\nWhat actually happened"
                        : type === "feature"
                          ? "Describe the feature in detail. What problem does it solve? How should it work?"
                          : "Provide as much detail as possible..."
                    }
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
                  />
                  <span className="absolute bottom-3 right-4 text-[10px] text-text-tertiary">
                    {2000 - description.length}
                  </span>
                </div>
              </div>

              {/* Auto-detected info */}
              <div className="bg-surface-alt/50 border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Auto-detected (sent with your submission)</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-surface border border-border text-text-secondary">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                    {deviceInfo.device}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-surface border border-border text-text-secondary">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                    {deviceInfo.browser}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-surface border border-border text-text-secondary">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                    {deviceInfo.screen}
                  </span>
                </div>
              </div>

              {/* Contact (optional) */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Contact <span className="text-text-tertiary font-medium normal-case">(optional — for follow-up)</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Discord tag, Twitter @, or email"
                  maxLength={200}
                  className="w-full px-4 py-3 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-danger font-bold animate-fade-in">{error}</p>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || !description.trim() || submitting}
                className="w-full px-5 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
