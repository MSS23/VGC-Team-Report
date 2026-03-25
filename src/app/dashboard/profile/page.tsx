"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { UserButton, Show, SignInButton } from "@clerk/nextjs";

interface Profile {
  bio: string;
  twitter: string;
  discord: string;
  youtube: string;
}

export default function ProfilePage() {
  return (
    <I18nProvider>
      <ProfileInner />
    </I18nProvider>
  );
}

function ProfileInner() {
  const { darkMode, setDarkMode } = useDarkMode();
  useEffect(() => { applyRandomAccent(); }, []);

  const [creatorName, setCreatorName] = useState("");
  const [profile, setProfile] = useState<Profile>({ bio: "", twitter: "", discord: "", youtube: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setCreatorName(data.creatorName);
          setProfile(data.profile);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/90 border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2 font-bold text-sm hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polyline points="15 18 9 12 15 6" /></svg>
            Dashboard
          </a>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all" aria-label="Toggle dark mode">
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              )}
            </button>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </Show>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Show when="signed-out">
          <div className="text-center py-20">
            <h1 className="text-2xl font-extrabold mb-3">Sign in to edit your profile</h1>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 shadow-md shadow-accent/30 transition-all cursor-pointer">Sign In</button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          {loading ? (
            <div className="flex justify-center py-16">
              <svg className="animate-spin h-5 w-5 text-text-secondary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1">Creator Profile</h1>
              <p className="text-sm text-text-secondary mb-8">
                This info appears on your creator page at <a href={`/creator/${encodeURIComponent(creatorName)}`} className="text-accent hover:underline">/creator/{creatorName}</a>
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Creator Name</label>
                  <div className="px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm text-text-primary">
                    {creatorName}
                    <span className="text-[10px] text-text-tertiary ml-2">(from your account)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, 500) })}
                    placeholder="Tell the VGC community about yourself..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
                  />
                  <span className="text-[10px] text-text-tertiary">{500 - profile.bio.length} characters remaining</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Twitter / X</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">@</span>
                      <input
                        type="text"
                        value={profile.twitter}
                        onChange={(e) => setProfile({ ...profile, twitter: e.target.value.replace(/^@/, "") })}
                        placeholder="username"
                        className="w-full pl-8 pr-4 py-3 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Discord</label>
                    <input
                      type="text"
                      value={profile.discord}
                      onChange={(e) => setProfile({ ...profile, discord: e.target.value })}
                      placeholder="username#1234"
                      className="w-full px-4 py-3 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">YouTube</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">@</span>
                      <input
                        type="text"
                        value={profile.youtube}
                        onChange={(e) => setProfile({ ...profile, youtube: e.target.value.replace(/^@/, "") })}
                        placeholder="channel"
                        className="w-full pl-8 pr-4 py-3 bg-surface border-2 border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all disabled:opacity-40 tracking-wide"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                  {saved && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">Saved!</span>}
                </div>
              </div>
            </motion.div>
          )}
        </Show>
      </main>
    </div>
  );
}
