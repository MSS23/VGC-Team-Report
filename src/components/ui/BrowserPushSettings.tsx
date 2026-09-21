"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export function BrowserPushSettings() {
  const { userId } = useAuth();
  const [supported, setSupported] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    if (!userId) return;
    setBusy(true); setLoadError(false); setMessage("");
    let disposed = false;
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    if (!available) { setBusy(false); return; }
    async function load() {
      try {
        const response = await fetch("/api/user/push", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load browser notification settings.");
        const subscription = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
        if (disposed) return;
        setPublicKey(data.publicKey);
        setEnabled(!!subscription && data.endpoints.includes(subscription.endpoint));
        if (!data.publicKey) setMessage("Browser notifications are not available yet.");
      } catch (error) { if (!disposed) { setLoadError(true); setMessage(error instanceof Error ? error.message : "Could not load notification settings."); } }
      finally { if (!disposed) setBusy(false); }
    }
    void load();
    return () => { disposed = true; };
  }, [userId, loadAttempt]);

  async function toggle() {
    setBusy(true); setMessage("");
    try {
      // Keep the permission prompt within the button's user activation.
      if (!enabled) {
        if (!publicKey) throw new Error("Browser notifications are not available yet.");
        if (await Notification.requestPermission() !== "granted") throw new Error("Notifications are blocked. Allow them in your browser's site settings to enable this feature.");
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active) throw new Error("Reload the app to activate browser notifications, then try again.");
      let subscription = await registration.pushManager.getSubscription();
      if (enabled) {
        if (subscription) {
          const response = await fetch("/api/user/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
          if (!response.ok) throw new Error("Could not disable notifications. Please try again.");
          await subscription.unsubscribe();
        }
        localStorage.removeItem("vgc-push-owner"); setEnabled(false); setMessage("Browser notifications disabled on this device.");
      } else {
        if (!publicKey) throw new Error("Browser notifications are not available yet.");
        if (subscription) await subscription.unsubscribe();
        // If device storage is blocked, fail before enabling a subscription
        // that could not be detached when the account signs out.
        localStorage.setItem("vgc-push-owner", userId!);
        const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
        try {
          subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
          const response = await fetch("/api/user/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
          if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? "Could not enable notifications."); }
          setEnabled(true); setMessage("Browser notifications enabled on this device.");
        } catch (error) { await subscription?.unsubscribe(); localStorage.removeItem("vgc-push-owner"); throw error; }
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update browser notifications."); }
    finally { setBusy(false); }
  }
  return <section className="mt-8 space-y-3 rounded-xl border border-border bg-surface p-4 sm:p-6" aria-label="Browser notifications"><h2 className="text-lg font-bold">Browser notifications</h2><p className="text-sm text-text-secondary">Get a notification for reactions, comments, invitations, and new reports from creators you follow, even with the tab closed. This choice applies to this browser, separately from email preferences. Notifications show a generic activity message; open the app for details.</p>{loadError && <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)} disabled={busy} className="min-h-11 rounded-lg border border-border px-4 font-semibold focus-visible:ring-2 focus-visible:ring-accent">Retry loading</button>}{supported ? <button onClick={() => void toggle()} disabled={busy || (!enabled && !publicKey)} aria-pressed={enabled} className="min-h-11 cursor-pointer rounded-lg border border-border px-4 font-semibold hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent">{busy ? "Checking…" : enabled ? "Disable on this browser" : "Enable on this browser"}</button> : <p className="text-sm text-text-secondary">Browser push is unavailable here. On supported mobile devices, installing the app may enable it.</p>}<p role="status" className="text-sm">{message}</p></section>;
}
