"use client";

import { useState, useEffect } from "react";
import { Show, SignInButton, useAuth } from "@clerk/nextjs";
import { I18nProvider } from "@/lib/i18n";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { PageFooter } from "@/components/layout/PageFooter";
import { BrowserPushSettings } from "@/components/ui/BrowserPushSettings";
import { DEFAULT_NOTIFICATION_PREFS, readNotificationPrefs, type NotificationPrefs } from "@/lib/notification-preferences";

const LEGACY_KEY = "vgc-notification-preferences";
const choices: { key: keyof NotificationPrefs; title: string; description: string }[] = [
  { key: "welcomeSeries", title: "Welcome Series", description: "Onboarding emails when you first join" },
  { key: "weeklyDigest", title: "Weekly Digest", description: "Weekly meta updates and trending teams" },
  { key: "socialActivity", title: "Social Activity", description: "When someone reacts, comments, or follows you" },
  { key: "productUpdates", title: "Product Updates", description: "New features and announcements" },
];
async function savePreferences(preferences: NotificationPrefs, signal?: AbortSignal, initialize = false) {
  const response = await fetch(`/api/user/preferences${initialize ? "?initialize=true" : ""}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preferences), signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Preferences were not saved.");
  return readNotificationPrefs(data.preferences);
}

export function NotificationsContent() {
  const { userId } = useAuth();
  return <I18nProvider><NotificationsInner key={userId ?? "signed-out"} userId={userId} /></I18nProvider>;
}

function NotificationsInner({ userId }: { userId: string | null | undefined }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => { applyRandomAccent(); }, []);
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    setLoading(true); setReady(false); setError("");
    async function load() {
      try {
        const response = await fetch("/api/user/preferences", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load preferences.");
        let preferences = readNotificationPrefs(data.preferences);
        // Migrate existing device choices once. Saved account choices always win.
        if (!data.initialized) {
          let legacy: string | null = null;
          try { legacy = localStorage.getItem(LEGACY_KEY); } catch { /* Storage is optional. */ }
          if (legacy) {
            let value: unknown;
            try { value = JSON.parse(legacy); } catch { value = null; }
            if (value && typeof value === "object" && !Array.isArray(value)) preferences = await savePreferences(readNotificationPrefs(value), controller.signal, true);
          }
        }
        if (controller.signal.aborted) return;
        setPrefs(preferences); setReady(true);
        try { localStorage.removeItem(LEGACY_KEY); } catch { /* Account preferences are authoritative. */ }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load preferences.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [userId, retry]);

  async function save(next: NotificationPrefs) {
    setSaving(true); setSaved(false); setError("");
    try { setPrefs(await savePreferences(next)); setSaved(true); }
    catch (error) { setError(error instanceof Error ? error.message : "Preferences were not saved."); }
    finally { setSaving(false); }
  }

  return <div className="min-h-screen bg-background text-text-primary">
    <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-12">
      <Show when="signed-out"><div className="py-20 text-center"><h1 className="mb-4 text-2xl font-bold">Sign in to manage notifications</h1><SignInButton mode="modal"><button className="min-h-11 cursor-pointer rounded-xl bg-text-primary px-6 font-bold text-background focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Sign In</button></SignInButton></div></Show>
      <Show when="signed-in">
        <a href="/dashboard" className="mb-4 inline-flex min-h-11 items-center text-sm text-text-secondary underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-accent">Back to Dashboard</a>
        <h1 className="text-2xl font-bold sm:text-3xl">Notification Preferences</h1>
        <p className="mt-2 mb-6 text-sm text-text-secondary">Choose which emails you receive. Your choices are saved to your account and apply across devices.</p>
        {loading && <p role="status" className="mb-4">Loading preferences…</p>}
        {error && <div className="mb-4 rounded-lg border border-danger p-4"><p role="alert">{error}</p>{!ready && !loading && <button onClick={() => setRetry((n) => n + 1)} className="mt-2 min-h-11 cursor-pointer rounded-lg border border-border px-4 focus-visible:ring-2 focus-visible:ring-accent">Retry loading</button>}</div>}
        <fieldset disabled={!ready || saving} className="mb-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface disabled:opacity-60"><legend className="sr-only">Email preferences</legend>
          {choices.map(({ key, title, description }) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4 p-4 sm:p-6"><span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-text-secondary">{description}</span></span><span className="flex min-h-11 min-w-11 items-center justify-center"><input type="checkbox" role="switch" aria-label={title} checked={prefs[key]} onChange={(e) => { setPrefs({ ...prefs, [key]: e.target.checked }); setSaved(false); }} className="h-6 w-6 accent-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" /></span></label>)}
        </fieldset>
        <div className="flex flex-wrap items-center gap-4"><button onClick={() => void save(prefs)} disabled={!ready || saving} className="min-h-11 cursor-pointer rounded-xl bg-text-primary px-6 font-bold text-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">{saving ? "Saving…" : "Save preferences"}</button><p role="status" className="text-sm">{saved ? "Preferences saved to your account." : ""}</p></div>
        <hr className="my-8 border-border" /><p className="text-sm text-text-secondary">Want to stop all emails?</p><button onClick={() => void save({ welcomeSeries: false, weeklyDigest: false, socialActivity: false, productUpdates: false })} disabled={!ready || saving} className="min-h-11 cursor-pointer text-sm font-semibold underline underline-offset-4 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent">Unsubscribe from all</button>
        <BrowserPushSettings />
      </Show>
    </main><PageFooter />
  </div>;
}
