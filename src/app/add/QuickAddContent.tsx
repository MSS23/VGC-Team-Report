"use client";

import { useState, useEffect } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { useAuth } from "@clerk/nextjs";

const TYPES = [
  { value: "feature", label: "Feature", emoji: "\uD83D\uDCA1" },
  { value: "bug", label: "Bug", emoji: "\uD83D\uDC1B" },
  { value: "improvement", label: "Improve", emoji: "\u26A1" },
  { value: "other", label: "Other", emoji: "\uD83D\uDCAC" },
] as const;

const PRIORITIES = [
  { value: 1, label: "Urgent" },
  { value: 2, label: "High" },
  { value: 3, label: "Normal" },
  { value: 4, label: "Low" },
] as const;

const PROJECTS = [
  "Roadmap",
  "Community Feedback",
  "Champions Launch",
  "Tech Debt & Polish",
] as const;

// Only these Clerk user IDs can access this page
const ALLOWED_USERS: string[] = [
  // Add your Clerk user ID here after first sign-in
  // Check via: Clerk Dashboard > Users
];

export function QuickAddContent() {
  const { darkMode } = useDarkMode();
  const { isLoaded, isSignedIn, userId } = useAuth();
  useEffect(() => { applyRandomAccent(); }, []);

  const [type, setType] = useState<string>("feature");
  const [priority, setPriority] = useState<number>(3);
  const [project, setProject] = useState<string>("Roadmap");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ identifier: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, priority, project, title: title.trim(), description: description.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create issue");

      setResult(data);
      setTitle("");
      setDescription("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950"><p className="text-zinc-500">Loading...</p></div>;
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 p-4">
        <div className="text-center">
          <p className="text-zinc-500 text-lg mb-4">Sign in to add items</p>
          <a href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Sign In</a>
        </div>
      </div>
    );
  }

  // If ALLOWED_USERS is populated, enforce access control
  if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(userId ?? "")) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 p-4">
        <p className="text-zinc-500">This page is restricted to project owners.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-zinc-950 text-white" : "bg-white text-zinc-900"}`}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Quick Add</h1>

        {/* Type selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`py-2 px-1 rounded-lg text-center text-sm font-medium transition-all ${
                type === t.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span className="block text-lg">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <input
          type="text"
          placeholder="What needs to happen?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />

        {/* Description */}
        <textarea
          placeholder="Details (optional — paste from Claude chat)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        {/* Priority + Project row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          >
            {PROJECTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          {submitting ? "Creating..." : "Add to Linear"}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              Created {result.identifier}
            </p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 underline"
            >
              Open in Linear
            </a>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
