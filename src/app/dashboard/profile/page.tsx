"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { UserButton, Show, SignInButton } from "@clerk/nextjs";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { PageFooter } from "@/components/layout/PageFooter";

interface Profile {
  bio: string;
  twitter: string;
  discord: string;
  youtube: string;
  isPublic: boolean;
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
  const [profile, setProfile] = useState<Profile>({ bio: "", twitter: "", discord: "", youtube: "", isPublic: true });
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
      <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} activePage="dashboard" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 pb-24 sm:pb-14">
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

                <div className="flex items-center justify-between p-4 bg-surface-alt border border-border rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-text-primary">Public profile</p>
                    <p className="text-xs text-text-secondary mt-0.5">When enabled, your creator page is discoverable by anyone</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.isPublic}
                    onClick={() => setProfile({ ...profile, isPublic: !profile.isPublic })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${profile.isPublic ? "bg-accent" : "bg-border"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${profile.isPublic ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
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
      <PageFooter maxWidth="max-w-2xl" />
    </div>
  );
}
