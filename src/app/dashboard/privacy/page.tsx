"use client";

import { useState, useEffect, useRef } from "react";
import { I18nProvider } from "@/lib/i18n";

import { applyRandomAccent } from "@/lib/utils/random-accent";
import { useClerk, Show, SignInButton } from "@clerk/nextjs";

import { PageFooter } from "@/components/layout/PageFooter";

export default function PrivacyDashboardPage() {
  return (
    <I18nProvider>
      <PrivacyDashboardInner />
    </I18nProvider>
  );
}

function PrivacyDashboardInner() {
  const { signOut } = useClerk();
  useEffect(() => { applyRandomAccent(); }, []);

  // Download state
  const [downloading, setDownloading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Delete state
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  // Modal a11y: trap focus, ESC-to-close, restore focus on close. This modal
  // controls an irreversible destructive action, so screen-reader users need
  // to know it has opened and keyboard users need a reliable Cancel path.
  useEffect(() => {
    if (!modalOpen) return;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const raf = requestAnimationFrame(() => cancelButtonRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) {
        setModalOpen(false);
        setDeleteInput("");
        setDeleteError(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [modalOpen, deleting]);

  async function handleDownload() {
    setDownloading(true);
    setExportError(null);
    try {
      const res = await fetch("/api/user/export");
      if (res.status === 429) {
        setExportError("Export limit reached. You can download once every 24 hours.");
        setDownloading(false);
        return;
      }
      if (!res.ok) {
        setExportError("Export failed. Please try again.");
        setDownloading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vgc-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Export failed. Please try again.");
    }
    setDownloading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) {
        setDeleteError("Deletion failed. Please try again or contact support.");
        setDeleting(false);
        return;
      }
      await signOut({ redirectUrl: "/" });
    } catch {
      setDeleteError("Deletion failed. Please try again or contact support.");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <Show when="signed-out">
          <div className="text-center py-20">
            <h1 className="text-2xl font-extrabold mb-3">Sign in to manage your data</h1>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-md shadow-accent/30 transition-all cursor-pointer">Sign In</button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          {/* Back link */}
          <a href="/dashboard" className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary mb-6 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to Dashboard
          </a>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Data & Privacy</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5 mb-8">
            Manage your personal data stored by VGC Team Report.
          </p>

          {/* Section 1: Download My Data */}
          <section>
            <h2 className="text-lg font-bold mb-2">Download My Data</h2>
            <p className="text-sm text-text-secondary mb-4">
              Export all your personal data — teams, notes, follows, reactions, and more — as a JSON file. You can request one export per 24 hours.
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? "Exporting..." : "Download My Data"}
            </button>
            {exportError && <p className="text-sm text-red-500 mt-2">{exportError}</p>}
          </section>

          <hr className="border-border my-8" />

          {/* Section 2: Delete My Account */}
          <section>
            <h2 className="text-lg font-bold mb-2">Delete My Account</h2>
            <p className="text-sm text-text-secondary mb-4">
              This permanently deletes all your teams, notes, follows, reactions, and your account. This action cannot be undone.
            </p>
            <button
              ref={deleteTriggerRef}
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 active:scale-[0.97] transition-all cursor-pointer"
            >
              Delete My Account
            </button>
          </section>

          {/* Confirmation Modal */}
          {modalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => {
                if (deleting) return;
                setModalOpen(false);
                setDeleteInput("");
                setDeleteError(null);
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                aria-describedby="delete-modal-desc"
                onClick={(e) => e.stopPropagation()}
                className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <h3 id="delete-modal-title" className="text-lg font-bold mb-3">Permanently delete your account?</h3>
                <p id="delete-modal-desc" className="text-sm text-text-secondary">
                  This will erase all your teams, notes, follows, reactions, and your account login. Type <strong>DELETE</strong> to confirm.
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  aria-label="Type DELETE to confirm account deletion"
                  className="w-full mt-4 px-3 py-2 text-sm border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-3 mt-6 justify-end">
                  <button
                    ref={cancelButtonRef}
                    onClick={() => { setModalOpen(false); setDeleteInput(""); setDeleteError(null); }}
                    className="px-4 py-2 text-sm font-bold text-text-secondary border border-border rounded-xl hover:bg-surface-alt transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteInput !== "DELETE" || deleting}
                    className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? "Deleting..." : "Delete My Account"}
                  </button>
                </div>
                {deleteError && <p className="text-sm text-red-500 mt-3">{deleteError}</p>}
              </div>
            </div>
          )}
        </Show>
      </main>

      <PageFooter />
    </div>
  );
}
