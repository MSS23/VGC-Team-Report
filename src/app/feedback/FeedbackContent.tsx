"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { getSessionId } from "@/lib/utils/session-id";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { PageFooter } from "@/components/layout/PageFooter";
import { SignInButton, useAuth } from "@clerk/nextjs";

const TYPES = [
  { value: "feature", label: "Feature Request", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", activeColor: "border-emerald-500/50 bg-emerald-500/15 shadow-emerald-500/10" },
  { value: "bug", label: "Bug Report", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01", color: "text-red-500 bg-red-500/10 border-red-500/20", activeColor: "border-red-500/50 bg-red-500/15 shadow-red-500/10" },
  { value: "improvement", label: "Improvement", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8", color: "text-amber-500 bg-amber-500/10 border-amber-500/20", activeColor: "border-amber-500/50 bg-amber-500/15 shadow-amber-500/10" },
  { value: "other", label: "Other", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", activeColor: "border-blue-500/50 bg-blue-500/15 shadow-blue-500/10" },
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
  const { isLoaded, isSignedIn } = useAuth();
  useEffect(() => { applyRandomAccent(); }, []);

  const [type, setType] = useState<string>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ device: "...", browser: "...", screen: "..." });

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

  const selectedType = TYPES.find((t) => t.value === type)!;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} activePage="feedback" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        {/* Loading state while auth initializes */}
        {!isLoaded ? (
          <div className="text-center py-16 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-surface-alt mx-auto mb-5" />
            <div className="h-7 w-48 bg-surface-alt rounded-lg mx-auto mb-3" />
            <div className="h-4 w-64 bg-surface-alt rounded mx-auto" />
          </div>
        ) : !isSignedIn ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Sign in to give feedback</h1>
            <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto leading-relaxed">
              We require sign-in so we can follow up on your feedback and keep submissions high quality.
            </p>
            <SignInButton mode="modal">
              <button className="px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all cursor-pointer tracking-wide">
                Sign in
              </button>
            </SignInButton>
          </motion.div>
        ) : submitted ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Thank you!</h1>
            <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">
              Your feedback has been submitted. We review every submission and use it to improve VGC Team Report.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a href="/" className="px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide">
                Back to Home
              </a>
              <button
                onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); setContact(""); }}
                className="px-6 py-2.5 text-sm font-bold text-text-secondary bg-surface border-2 border-border hover:border-accent/30 rounded-xl transition-all cursor-pointer"
              >
                Submit Another
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Hero */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-surface flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Send Feedback
                </h1>
                <p className="text-sm text-text-secondary">
                  Help us make VGC Team Report better
                </p>
              </div>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-8 mb-8">
              {TYPES.map((t, i) => (
                <motion.button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.35 }}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    type === t.value
                      ? `${t.activeColor} shadow-sm`
                      : "border-border hover:border-accent/20 bg-surface"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    type === t.value ? t.color : "text-text-tertiary bg-surface-alt/50"
                  }`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={t.icon} />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold transition-colors ${type === t.value ? "text-text-primary" : "text-text-secondary"}`}>
                    {t.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Form */}
            <motion.div
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {/* Title */}
              <div>
                <label htmlFor="feedback-title" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Title <span className="text-accent">*</span>
                </label>
                <input
                  id="feedback-title"
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
                <label htmlFor="feedback-description" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Description <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="feedback-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                    placeholder={
                      type === "bug"
                        ? "Steps to reproduce:\n1. Go to...\n2. Click on...\n3. See error...\n\nExpected behaviour:\nWhat should have happened\n\nActual behaviour:\nWhat actually happened"
                        : type === "feature"
                          ? "Describe the feature in detail. What problem does it solve? How should it work?"
                          : "Provide as much detail as possible..."
                    }
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
                  />
                  <span className={`absolute bottom-3 right-4 text-[10px] font-bold transition-colors ${
                    description.length > 1800 ? "text-amber-500" : "text-text-tertiary"
                  }`}>
                    {2000 - description.length}
                  </span>
                </div>
              </div>

              {/* Auto-detected info */}
              <div className="bg-surface-alt/50 border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                  Auto-detected (sent with your submission)
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: "M5 2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01", label: deviceInfo.device },
                    { icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z", label: deviceInfo.browser },
                    { icon: "M2 3h20a2 2 0 012 2v14a2 2 0 01-2 2H2a2 2 0 01-2-2V5a2 2 0 012-2zM8 21h8M12 17v4", label: deviceInfo.screen },
                  ].map((info, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-surface border border-border text-text-secondary">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={info.icon} /></svg>
                      {info.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact (optional) */}
              <div>
                <label htmlFor="feedback-contact" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Contact <span className="text-text-tertiary font-medium normal-case">(optional — for follow-up)</span>
                </label>
                <input
                  id="feedback-contact"
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
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-danger font-bold px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || !description.trim() || submitting}
                className={`w-full px-5 py-3.5 text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.98] shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-wide flex items-center justify-center gap-2 ${
                  selectedType.value === "bug"
                    ? "bg-red-500 shadow-red-500/30"
                    : selectedType.value === "improvement"
                      ? "bg-amber-500 shadow-amber-500/30"
                      : selectedType.value === "other"
                        ? "bg-blue-500 shadow-blue-500/30"
                        : "bg-accent shadow-accent/30"
                }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" /><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Submit {selectedType.label}
                  </>
                )}
              </button>

              {/* Links to changelog */}
              <p className="text-center text-xs text-text-tertiary pt-2">
                Want to see what we&apos;ve already shipped?{" "}
                <a href="/changelog" className="font-bold text-accent hover:underline">
                  View the changelog
                </a>
              </p>
            </motion.div>
          </motion.div>
        )}
      </main>

      <PageFooter hideFeedback />
    </div>
  );
}
