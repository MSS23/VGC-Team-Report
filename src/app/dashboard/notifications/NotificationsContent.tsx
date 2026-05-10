"use client";

import { useState, useEffect } from "react";
import { I18nProvider } from "@/lib/i18n";

import { applyRandomAccent } from "@/lib/utils/random-accent";
import { Show, SignInButton } from "@clerk/nextjs";

import { PageFooter } from "@/components/layout/PageFooter";
import { Toggle } from "@/components/ui/Toggle";

const STORAGE_KEY = "vgc-notification-preferences";

interface NotificationPrefs {
  welcomeSeries: boolean;
  weeklyDigest: boolean;
  socialActivity: boolean;
  productUpdates: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  welcomeSeries: true,
  weeklyDigest: true,
  socialActivity: true,
  productUpdates: true,
};

export function NotificationsContent() {
  return (
    <I18nProvider>
      <NotificationsInner />
    </I18nProvider>
  );
}

function NotificationsInner() {
  useEffect(() => { applyRandomAccent(); }, []);

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      }
    } catch { /* silent — use defaults */ }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleUnsubAll = () => {
    const allOff: NotificationPrefs = {
      welcomeSeries: false,
      weeklyDigest: false,
      socialActivity: false,
      productUpdates: false,
    };
    setPrefs(allOff);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allOff));
    } catch { /* silent */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <Show when="signed-out">
          <div className="text-center py-20">
            <h1 className="text-2xl font-extrabold mb-3">Sign in to manage notifications</h1>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-md shadow-accent/30 transition-all cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          {/* Back link */}
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary mb-6 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </a>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Notification Preferences</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5 mb-8">
            Choose which emails you want to receive from VGC Team Report.
          </p>

          {/* Preference rows */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border mb-6">
            {/* Welcome Series */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary">Welcome Series</p>
                <p className="text-xs text-text-secondary mt-0.5">Onboarding emails when you first join</p>
              </div>
              <div className="flex-shrink-0">
                <Toggle
                  checked={prefs.welcomeSeries}
                  onChange={(v) => setPrefs({ ...prefs, welcomeSeries: v })}
                  label="Welcome Series"
                />
              </div>
            </div>

            {/* Weekly Digest */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary">Weekly Digest</p>
                <p className="text-xs text-text-secondary mt-0.5">Weekly meta updates and trending teams</p>
              </div>
              <div className="flex-shrink-0">
                <Toggle
                  checked={prefs.weeklyDigest}
                  onChange={(v) => setPrefs({ ...prefs, weeklyDigest: v })}
                  label="Weekly Digest"
                />
              </div>
            </div>

            {/* Social Activity */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary">Social Activity</p>
                <p className="text-xs text-text-secondary mt-0.5">When someone reacts, comments, or follows you</p>
              </div>
              <div className="flex-shrink-0">
                <Toggle
                  checked={prefs.socialActivity}
                  onChange={(v) => setPrefs({ ...prefs, socialActivity: v })}
                  label="Social Activity"
                />
              </div>
            </div>

            {/* Product Updates */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary">Product Updates</p>
                <p className="text-xs text-text-secondary mt-0.5">New features and announcements</p>
              </div>
              <div className="flex-shrink-0">
                <Toggle
                  checked={prefs.productUpdates}
                  onChange={(v) => setPrefs({ ...prefs, productUpdates: v })}
                  label="Product Updates"
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wide cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
            >
              {saving ? "Saving..." : "Save preferences"}
            </button>
            {saved && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                Preferences saved!
              </span>
            )}
          </div>

          <hr className="border-border my-8" />

          {/* Unsubscribe from all */}
          <div>
            <p className="text-xs text-text-secondary mb-2">
              Want to stop all emails?
            </p>
            <button
              type="button"
              onClick={handleUnsubAll}
              className="text-xs font-semibold text-text-tertiary hover:text-red-500 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Unsubscribe from all
            </button>
          </div>
        </Show>
      </main>

      <PageFooter />
    </div>
  );
}
