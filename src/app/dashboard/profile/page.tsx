"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { I18nProvider } from "@/lib/i18n";

import { applyRandomAccent } from "@/lib/utils/random-accent";
import { applyAccentTheme, ACCENT_THEMES } from "@/lib/accent-themes";
import { UserButton, Show, SignInButton } from "@clerk/nextjs";

import { PageFooter } from "@/components/layout/PageFooter";
import { ThemePicker } from "@/components/ui/ThemePicker";

interface Profile {
  bio: string;
  twitter: string;
  discord: string;
  youtube: string;
  isPublic: boolean;
  accentTheme: string | null;
  avatarUrl: string;
}

export default function ProfilePage() {
  return (
    <I18nProvider>
      <ProfileInner />
    </I18nProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Section card wrapper                                               */
/* ------------------------------------------------------------------ */
function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-alt/40">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-surface text-accent">
          {icon}
        </span>
        <div>
          <h2 className="text-sm font-bold text-text-primary leading-tight">{title}</h2>
          {description && (
            <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live preview card                                                  */
/* ------------------------------------------------------------------ */
function ProfilePreview({
  creatorName,
  profile,
  clerkImageUrl,
}: {
  creatorName: string;
  profile: Profile;
  clerkImageUrl: string | null;
}) {
  const displayAvatar = profile.avatarUrl || clerkImageUrl;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header banner */}
      <div className="h-20 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent" />

      <div className="px-5 pb-5 -mt-8">
        {/* Avatar */}
        <div className="mb-3">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={creatorName}
              className="w-16 h-16 rounded-full object-cover border-[3px] border-surface shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent-surface border-[3px] border-surface shadow-md flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>

        {/* Name + badge */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-extrabold text-text-primary leading-tight">{creatorName || "Your Name"}</h3>
          {profile.isPublic && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-accent-surface text-accent uppercase tracking-wide">Public</span>
          )}
        </div>

        {/* Bio */}
        {profile.bio ? (
          <p className="text-xs text-text-secondary leading-relaxed mt-1 line-clamp-3">{profile.bio}</p>
        ) : (
          <p className="text-xs text-text-tertiary italic mt-1">No bio yet</p>
        )}

        {/* Social links */}
        {(profile.twitter || profile.discord || profile.youtube) && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {profile.twitter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-surface-alt text-text-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                @{profile.twitter}
              </span>
            )}
            {profile.discord && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-surface-alt text-text-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" /></svg>
                {profile.discord}
              </span>
            )}
            {profile.youtube && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg bg-surface-alt text-text-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                @{profile.youtube}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-surface-alt/30">
        <p className="text-[10px] text-text-tertiary text-center">
          Preview of{" "}
          <a href={`/creator/${encodeURIComponent(creatorName)}`} className="text-accent hover:underline">
            /creator/{creatorName}
          </a>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
function ProfileInner() {
  useEffect(() => { applyRandomAccent(); }, []);

  const [creatorName, setCreatorName] = useState("");
  const [clerkImageUrl, setClerkImageUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({ bio: "", twitter: "", discord: "", youtube: "", isPublic: true, accentTheme: null, avatarUrl: "" });
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Track the initial profile to detect unsaved changes
  const initialProfileRef = useRef<Profile | null>(null);
  const hasChanges = useMemo(() => {
    if (!initialProfileRef.current) return false;
    return JSON.stringify(profile) !== JSON.stringify(initialProfileRef.current);
  }, [profile]);

  useEffect(() => {
    // Fetch profile and analytics in parallel
    Promise.all([
      fetch("/api/user/profile").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/user/analytics").then((r) => (r.ok ? r.json() : null)),
    ]).then(([profileData, analyticsData]) => {
      if (profileData) {
        setCreatorName(profileData.creatorName);
        setClerkImageUrl(profileData.clerkImageUrl || null);
        setProfile(profileData.profile);
        initialProfileRef.current = profileData.profile;
        // Apply the user's saved theme instead of random
        if (profileData.profile.accentTheme) {
          const theme = ACCENT_THEMES.find((t) => t.id === profileData.profile.accentTheme);
          if (theme) applyAccentTheme(theme);
        }
      }
      if (analyticsData?.overview) {
        setTotalViews(analyticsData.overview.totalViews || 0);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
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
        initialProfileRef.current = { ...profile };
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  /* shared input classes */
  const inputCls = "w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all";

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-28">
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
              {/* Page header */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold tracking-tight mb-1">Creator Profile</h1>
                <p className="text-sm text-text-secondary">
                  Manage how you appear on{" "}
                  <a href={`/creator/${encodeURIComponent(creatorName)}`} className="text-accent hover:underline">
                    your public creator page
                  </a>
                </p>
              </div>

              {/* Two-column layout: form + preview */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

                {/* LEFT: Form sections */}
                <div className="flex-1 min-w-0 space-y-6 w-full">

                  {/* --- IDENTITY SECTION --- */}
                  <SectionCard
                    title="Identity"
                    description="Your name and profile picture"
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    }
                  >
                    {/* Creator name (read-only) */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Creator Name</label>
                      <div className="px-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm text-text-primary flex items-center justify-between">
                        <span>{creatorName}</span>
                        <span className="text-[10px] text-text-tertiary">Synced from account</span>
                      </div>
                    </div>

                    {/* Profile picture */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Profile Picture</label>
                      <div className="flex items-center gap-4">
                        {/* Avatar preview */}
                        <div className="flex-shrink-0">
                          {(profile.avatarUrl || clerkImageUrl) ? (
                            <img
                              src={profile.avatarUrl || clerkImageUrl!}
                              alt={creatorName}
                              className="w-14 h-14 rounded-full object-cover border-2 border-accent/20 shadow-sm"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-accent-surface flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <input
                            type="text"
                            value={profile.avatarUrl}
                            onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                            placeholder="https://example.com/your-photo.jpg"
                            className={inputCls}
                          />
                          <div className="flex items-center gap-3">
                            {clerkImageUrl && (
                              <button
                                type="button"
                                onClick={() => setProfile({ ...profile, avatarUrl: clerkImageUrl })}
                                className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                              >
                                Use account photo
                              </button>
                            )}
                            {profile.avatarUrl && (
                              <button
                                type="button"
                                onClick={() => setProfile({ ...profile, avatarUrl: "" })}
                                className="text-[11px] font-bold text-text-tertiary hover:text-red-500 cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-text-tertiary mt-2">Paste a link to your profile picture (must be HTTPS), or use your account photo.</p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label htmlFor="profile-bio" className="block text-xs font-semibold text-text-secondary mb-1.5">Bio</label>
                      <textarea
                        id="profile-bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, 500) })}
                        placeholder="Tell the VGC community about yourself..."
                        rows={3}
                        maxLength={500}
                        className={`${inputCls} resize-none`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-text-tertiary">Displayed on your creator page</span>
                        <span className={`text-[10px] font-medium ${profile.bio.length > 450 ? "text-amber-500" : "text-text-tertiary"}`}>
                          {500 - profile.bio.length} left
                        </span>
                      </div>
                    </div>
                  </SectionCard>

                  {/* --- SOCIAL LINKS SECTION --- */}
                  <SectionCard
                    title="Social Links"
                    description="Connect your accounts so fans can find you"
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                    }
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Twitter */}
                      <div>
                        <label htmlFor="profile-twitter" className="block text-xs font-semibold text-text-secondary mb-1.5">Twitter / X</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">@</span>
                          <input
                            id="profile-twitter"
                            type="text"
                            value={profile.twitter}
                            onChange={(e) => setProfile({ ...profile, twitter: e.target.value.replace(/^@/, "") })}
                            placeholder="username"
                            className={`${inputCls} !pl-8`}
                          />
                        </div>
                      </div>

                      {/* Discord */}
                      <div>
                        <label htmlFor="profile-discord" className="block text-xs font-semibold text-text-secondary mb-1.5">Discord</label>
                        <input
                          id="profile-discord"
                          type="text"
                          value={profile.discord}
                          onChange={(e) => setProfile({ ...profile, discord: e.target.value })}
                          placeholder="username#1234"
                          className={inputCls}
                        />
                      </div>

                      {/* YouTube */}
                      <div>
                        <label htmlFor="profile-youtube" className="block text-xs font-semibold text-text-secondary mb-1.5">YouTube</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">@</span>
                          <input
                            id="profile-youtube"
                            type="text"
                            value={profile.youtube}
                            onChange={(e) => setProfile({ ...profile, youtube: e.target.value.replace(/^@/, "") })}
                            placeholder="channel"
                            className={`${inputCls} !pl-8`}
                          />
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* --- APPEARANCE SECTION --- */}
                  <SectionCard
                    title="Appearance"
                    description="Customize how your profile looks"
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20" />
                        <path d="M2 12h20" />
                      </svg>
                    }
                  >
                    <ThemePicker
                      totalViews={totalViews}
                      selectedTheme={profile.accentTheme}
                      onSelect={(themeId) => setProfile({ ...profile, accentTheme: themeId })}
                    />
                  </SectionCard>

                  {/* --- PRIVACY SECTION --- */}
                  <SectionCard
                    title="Privacy"
                    description="Control who can see your profile"
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    }
                  >
                    <div className="flex items-center justify-between">
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
                  </SectionCard>
                </div>

                {/* RIGHT: Live preview (sticky on desktop) */}
                <div className="w-full lg:w-80 lg:sticky lg:top-24 order-first lg:order-last flex-shrink-0">
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-1">Live Preview</p>
                    <ProfilePreview
                      creatorName={creatorName}
                      profile={profile}
                      clerkImageUrl={clerkImageUrl}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </Show>
      </main>

      {/* Sticky save bar */}
      <AnimatePresence>
        {hasChanges && !loading && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md shadow-[0_-4px_20px_rgb(0_0_0/0.08)]"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <p className="text-xs text-text-secondary">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 align-middle" />
                You have unsaved changes
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (initialProfileRef.current) setProfile({ ...initialProfileRef.current });
                  }}
                  className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-accent text-white text-xs font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all disabled:opacity-40 tracking-wide focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                {saved && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                    Saved!
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageFooter />
    </div>
  );
}
