"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { editorFingerprint } from "@/lib/sharing/collaboration";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  decodeShareState,
  type ShareableState,
} from "@/lib/sharing/url-codec";

type ShareStatus = "idle" | "copying" | "copied" | "error";

export interface ForkedFromMeta {
  id: string;
  creatorName: string | null;
  tournamentName: string | null;
  species: string[];
  deleted: boolean;
}

const SHARE_TOKENS_KEY = "vgc-share-tokens";

interface StoredShareInfo {
  shareId: string;
  editToken: string;
}

/** Detect share ID from hash (fallback for #id= links). */
function detectHashId(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#id=")) return hash.slice("#id=".length) || null;
  return null;
}

/**
 * Detect share ID from the URL pathname (e.g. /s/abcd1234).
 *
 * This is the fallback that keeps the share alive after we clean the URL
 * with `history.replaceState(null, "", "/s/{id}")` further down. Next.js
 * 16's App Router syncs `useSearchParams` with window history changes, so
 * once the `?s=` query param is gone, `searchParams.get("s")` returns
 * null — without this fallback, the clearing effect would wipe sharedState
 * and bounce the viewer back to the home/landing page. Guests and owners
 * both rely on this to actually see a clicked team report.
 */
function detectPathnameShareId(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/s\/([A-Za-z0-9]{8})(?:\/|$)/);
  return match ? match[1] : null;
}

function detectInlineData(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#data=")) return hash.slice("#data=".length) || null;
  return null;
}

/**
 * Keys that `POST /api/share` deliberately stores looser than
 * `ShareableStateSchema` accepts: `hiddenSlides` is written as
 * `(number | string)[]` (legacy numeric slide ids) and `spriteSettings` as an
 * unchecked `unknown`. Both are view preferences rather than report content —
 * `hiddenSlides` feeds a `Set<string>` of slide keys and `spriteSettings` has
 * no reader left in the client — so a legacy value in one of them must not
 * make a legitimate report unopenable.
 */
const LEGACY_TOLERANT_KEYS = ["hiddenSlides", "spriteSettings"] as const;

/**
 * Runtime-validate a `/api/share/{id}` body before it becomes report state.
 *
 * VGC-146 added `ShareableStateSchema` and wired it into the URL-decode path
 * (`decodeShareState`), which runs `safeParse` and fails closed. The fetch
 * path — the one every `/s/{id}` view actually takes — kept an unchecked
 * `as ShareableState` cast, so a malformed row or a tampered response could
 * push arbitrary shapes into the report viewer. That blows up inside React's
 * render pass, where the `.catch()` on the fetch chain cannot see it, and the
 * viewer gets a white screen instead of the existing error state.
 *
 * Mirrors the codec exactly: `null` on shape mismatch, which `settle()` turns
 * into the "corrupt link" screen the hook already shows. No new error UX.
 *
 * The schemas are loaded with `await import()` on purpose — a static import
 * would pull ~63 kB gzip of zod back into the homepage bundle and undo
 * VGC-256 (see the rules block in `url-codec.schemas.ts`).
 */
export async function parseFetchedShareState(
  raw: unknown,
): Promise<ShareableState | null> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { ShareableStateSchema } = await import("@/lib/sharing/url-codec.schemas");

  const parsed = ShareableStateSchema.safeParse(raw);
  if (parsed.success) return parsed.data as ShareableState;

  // Retry once with the legacy-tolerant keys removed, but only when every
  // complaint is about one of them. Anything structural — paste, notes,
  // matchupPlans, tags… — still fails closed.
  const offending = parsed.error.issues.map((issue) => issue.path[0]);
  const onlyTolerable =
    offending.length > 0 &&
    offending.every(
      (key) =>
        typeof key === "string" &&
        (LEGACY_TOLERANT_KEYS as readonly string[]).includes(key),
    );
  if (!onlyTolerable) return null;

  const relaxed: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  for (const key of LEGACY_TOLERANT_KEYS) delete relaxed[key];
  const retry = ShareableStateSchema.safeParse(relaxed);
  return retry.success ? (retry.data as ShareableState) : null;
}

export function useShareUrl() {
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  // Use Next.js searchParams (works correctly across SSR and hydration)
  const searchParams = useSearchParams();
  // shareId resolves in priority order:
  //   1. ?s= query param (initial load via /s/[id]/page.tsx redirect)
  //   2. /s/{id} pathname (after we clean the URL via history.replaceState)
  //   3. #id= hash fragment (legacy short-link format)
  // (2) is the load-bearing one: in Next.js 16, useSearchParams stays in
  // sync with history.replaceState, so the query-param read drops to null
  // the moment we rewrite the URL — without the pathname fallback, the
  // clearing effect below would tear down the in-progress shared view.
  const shareId =
    searchParams.get("s") || detectPathnameShareId() || detectHashId();
  const editKeyFromUrl = searchParams.get("key") || null;
  const [inlineData] = useState(detectInlineData);
  const isSharePending = !!(shareId || inlineData);

  const [isSharedView, setIsSharedView] = useState(false);
  const [sharedState, setSharedState] = useState<ShareableState | null>(null);
  const versionRef = useRef(0);
  const baselineRef = useRef<ShareableState | null>(null);
  const conflictRef = useRef<{ state: ShareableState; version: number } | null>(null);
  const [conflict, setConflictState] = useState<typeof conflictRef.current>(null);
  const setConflict = useCallback((value: typeof conflictRef.current) => { conflictRef.current = value; setConflictState(value); }, []);
  const getVersion = useCallback(() => versionRef.current, []);
  const receiveRemote = useCallback((state: ShareableState, version: number, local: ShareableState) => {
    if (version <= versionRef.current) return false;
    if (conflictRef.current || (baselineRef.current && editorFingerprint(local) !== editorFingerprint(baselineRef.current))) {
      setConflict({ state, version }); return false;
    }
    versionRef.current = version; baselineRef.current = state; return true;
  }, [setConflict]);
  const resolveConflict = useCallback((choice: "remote" | "local") => {
    const latest = conflictRef.current;
    if (!latest) return null;
    versionRef.current = latest.version; baselineRef.current = latest.state;
    setConflict(null);
    return choice === "remote" ? latest.state : null;
  }, [setConflict]);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [fetchedIsPublic, setFetchedIsPublic] = useState<boolean | null>(null);
  const [fetchedIsUnlisted, setFetchedIsUnlisted] = useState<boolean | null>(null);
  const [fetchedCollaborators, setFetchedCollaborators] = useState<string[]>([]);
  const [forkedFrom, setForkedFrom] = useState<ForkedFromMeta | null>(null);
  const [redactedFields, setRedactedFields] = useState<string[]>([]);
  const [lastShareResult, setLastShareResult] = useState<{
    updated: boolean;
    publicUrl?: string;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Active session refs — only set from a server response after account
  // authorization, or after this account creates/updates a share. They are
  // deliberately memory-only and are the source of truth for update vs create.
  const activeEditTokenRef = useRef<string | null>(null);
  const activeShareIdRef = useRef<string | null>(null);
  // Reactive state version of activeShareIdRef — tracks whether a share session exists
  // (set after sharing from home page, or when viewing own report at /s/{id})
  const [sessionShareId, setSessionShareId] = useState<string | null>(null);

  // Remove token data written by older releases. It is never read by this
  // version, and clearing it avoids leaving obsolete edit credentials in a
  // shared browser profile.
  useEffect(() => {
    try {
      localStorage.removeItem(SHARE_TOKENS_KEY);
    } catch { /* storage may be unavailable */ }
  }, []);

  // Clear session state when URL no longer points at a share.
  // Without this, navigating from /s/{id} back to / would leave
  // activeShareIdRef/activeEditTokenRef pointing at the old share, causing
  // the next Share click to silently overwrite that report with whatever
  // is currently in memory. React bails out of setState when the value is
  // unchanged, so running this unconditionally on every home-page render
  // is effectively free.
  useEffect(() => {
    if (shareId || inlineData) return;
    activeEditTokenRef.current = null;
    activeShareIdRef.current = null;
    versionRef.current = 0; baselineRef.current = null; setConflict(null);
    setSessionShareId(null);
    setSharedState(null);
    setIsSharedView(false);
    setIsEditingUnlocked(false);
    setIsOwner(false);
    setFetchedIsPublic(null);
    setFetchedIsUnlisted(null);
    setFetchedCollaborators([]);
    setForkedFrom(null);
    setRedactedFields([]);
  }, [shareId, inlineData]);

  // Fetch shared state on mount
  useEffect(() => {
    if (shareId && !isAuthLoaded) return;

    // Auth changes must revoke the editable client state immediately. The
    // authenticated refetch below is the only path that can unlock it again.
    activeEditTokenRef.current = null;
    activeShareIdRef.current = null;
    versionRef.current = 0; baselineRef.current = null; setConflict(null);
    setSessionShareId(null);
    setIsEditingUnlocked(false);
    setIsOwner(false);

    let settled = false;
    // Clear any stale failure from a previous run. decodeFailed is otherwise
    // write-once (never reset), so a single spurious timeout would lock the
    // viewer on the "corrupt link" error screen forever, even after a retry.
    setDecodeFailed(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        // Abort the in-flight fetch so a late success can't half-apply after
        // we've already given up.
        controller.abort();
        setDecodeFailed(true);
      }
    }, 15000); // 5s was too aggressive for Neon cold start + edge miss on slow networks

    const settle = (state: ShareableState | null, editable?: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (state) {
        setIsSharedView(true);
        setSharedState(state);
        if (editable) {
          setIsEditingUnlocked(true);
        }
      } else {
        setDecodeFailed(true);
      }
    };

    if (shareId) {
      // Always fetch without the edit key first — the API will grant edit
      // access to authenticated owners/collaborators automatically.
      // A legacy ?key= may still trigger the sign-in explanation in page.tsx,
      // but it is never sent to the API. The account alone determines access.
      const fetchUrl = `/api/share/${shareId}`;

      fetch(fetchUrl, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then(async (data) => {
          if (!data || typeof data !== "object") return settle(null);
          const editable = data._editable === true;
          if (data._isPublic !== undefined) setFetchedIsPublic(!!data._isPublic);
          if (data._isUnlisted !== undefined) setFetchedIsUnlisted(!!data._isUnlisted);
          setIsOwner(!!data._isOwner);
          setForkedFrom((data._forkedFrom as ForkedFromMeta | null) ?? null);
          setRedactedFields(Array.isArray(data._redactedFields) ? (data._redactedFields as string[]) : []);
          // The API returns _editToken for authenticated owners/collaborators
          const ownerEditToken = data._editToken as string | undefined;
          // Strip internal flags before treating as ShareableState
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _editable, _isPublic: _ip, _isUnlisted: _iu, _editToken: _et, _isOwner: _io, _version: _v, _collaborators: _c, _forkedFrom: _ff, _redactedFields: _rf, ...state } = data;
          versionRef.current = Number(_v) || 1; baselineRef.current = state as ShareableState;
          if (Array.isArray(_c)) setFetchedCollaborators(_c as string[]);
          // Runtime-validated instead of cast — a malformed body fails closed
          // into the same error screen a corrupt link already produces.
          const validated = await parseFetchedShareState(state);
          // Set active edit session — only from server-provided token
          // (authenticated), and only for a report that actually validated: a
          // rejected body must not leave an editable session pointing at that
          // share, or the next save would overwrite it from memory.
          if (validated && editable && ownerEditToken) {
            activeEditTokenRef.current = ownerEditToken;
            activeShareIdRef.current = shareId;
            setSessionShareId(shareId);
          }
          settle(validated, editable);
        })
        .catch(() => settle(null));

      // Replace URL with clean /s/{id} path (strip query params but keep share context)
      history.replaceState(null, "", `/s/${shareId}`);

      return () => { clearTimeout(timeout); controller.abort(); };
    }

    if (inlineData) {
      decodeShareState(inlineData)
        .then((state) => settle(state))
        .catch(() => settle(null));
      return () => { clearTimeout(timeout); controller.abort(); };
    }

    clearTimeout(timeout);
    // editKeyFromUrl is intentionally not a dependency: it has no bearing on
    // access, and history.replaceState strips it immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId, inlineData, isAuthLoaded, userId]);

  /** Get the active share info for this session (from refs, not localStorage). */
  const getActiveShare = useCallback((): StoredShareInfo | null => {
    if (activeShareIdRef.current && activeEditTokenRef.current) {
      return {
        shareId: activeShareIdRef.current,
        editToken: activeEditTokenRef.current,
      };
    }
    return null;
  }, []);

  const copyShareUrl = useCallback(async (
    state: ShareableState,
    isPublic?: boolean,
    isUnlisted?: boolean,
    draftId?: string | null,
  ): Promise<{ ok: boolean; error?: string; version?: number }> => {
    if (conflictRef.current) return { ok: false, error: "Resolve the collaboration conflict first." };
    setShareStatus("copying");
    setUrlWarning(null);
    setLastShareResult(null);
    try {
      let publicUrl: string;

      // Only reuse an existing share if we have an active session with it
      const active = getActiveShare();

      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state,
            expectedVersion: active ? versionRef.current || undefined : undefined,
            existingId: active?.shareId,
            editToken: active?.editToken,
            draftId: draftId ?? undefined,
            isPublic,
            isUnlisted,
            isPublish: true,
          }),
        });
        if (!res.ok) {
          // Surface the server's reason (e.g. "no tags on this report") so the
          // caller can show it, instead of swallowing it into a transient
          // "Failed" button label with no explanation.
          let errorMessage: string | undefined;
          try {
            const body = await res.json();
            if (res.status === 409 && body.state && Number.isInteger(Number(body.version))) setConflict({ state: body.state, version: Number(body.version) });
            if (body && typeof body.error === "string") errorMessage = body.error;
          } catch { /* non-JSON */ }
          setShareStatus("error");
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setShareStatus("idle"), 3000);
          return { ok: false, error: errorMessage ?? `Share failed (${res.status})` };
        }
        const { id, editToken, updated, version } = await res.json();
        if ((Number(version) || 1) >= versionRef.current) { versionRef.current = Number(version) || 1; baselineRef.current = state; }
        publicUrl = `${window.location.origin}/s/${id}`;

        activeEditTokenRef.current = editToken;
        activeShareIdRef.current = id;
        setSessionShareId(id);
        setLastShareResult({ updated, publicUrl });
        // The caller just successfully created or updated a share, so they
        // own the edit token for this session. Mark them as the owner so
        // UI gates (like the "List on Explore" toggle in ShareModal) don't
        // stay disabled after a first-time share.
        setIsOwner(true);
      } catch {
        setShareStatus("error");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShareStatus("idle"), 3000);
        return { ok: false, error: "Network error while sharing. Please try again." };
      }

      await navigator.clipboard.writeText(publicUrl);
      setShareStatus("copied");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShareStatus("idle");
      }, 5000);
      return { ok: true, version: versionRef.current };
    } catch {
      setShareStatus("error");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShareStatus("idle"), 2000);
      return { ok: false, error: "Could not copy the share link." };
    }
  }, [getActiveShare, setConflict]);

  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Silent auto-save: push current state to the server.
   *
   * Returns a result object so callers (e.g. the visibility toggle) can
   * react to failures and revert optimistic UI changes. Previously this
   * returned void and swallowed every non-200 response into a generic
   * "error" status, which is how a failed "List on Explore" toggle could
   * look "saved" to the user while the server silently kept the old
   * visibility.
   */
  const autoSave = useCallback(async (
    state: ShareableState,
    isPublic?: boolean,
    isUnlisted?: boolean
  ): Promise<{ ok: boolean; error?: string; status?: number; version?: number }> => {
    if (conflictRef.current) return { ok: false, status: 409, error: "Resolve the collaboration conflict first." };
    const active = getActiveShare();
    if (!active) {
      return { ok: false, error: "No active share session to update." };
    }
    setAutoSaveStatus("saving");
    if (autoSaveResetRef.current) clearTimeout(autoSaveResetRef.current);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          expectedVersion: versionRef.current || undefined,
          existingId: active.shareId,
          editToken: active.editToken,
          isPublic,
          isUnlisted,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if ((Number(data.version) || versionRef.current) >= versionRef.current) { versionRef.current = Number(data.version) || versionRef.current; baselineRef.current = state; }
        setAutoSaveStatus("saved");
        autoSaveResetRef.current = setTimeout(() => setAutoSaveStatus("idle"), 3000);
        return { ok: true, status: res.status, version: versionRef.current };
      }
      // Parse server error message if provided so the UI can surface it
      let errorMessage: string | undefined;
      try {
        const body = await res.json();
        if (res.status === 409 && body.state && Number.isInteger(Number(body.version))) setConflict({ state: body.state, version: Number(body.version) });
        if (body && typeof body.error === "string") errorMessage = body.error;
      } catch { /* non-JSON response */ }
      setAutoSaveStatus("error");
      autoSaveResetRef.current = setTimeout(() => setAutoSaveStatus("idle"), 3000);
      return { ok: false, status: res.status, error: errorMessage ?? `Save failed (${res.status})` };
    } catch (e) {
      setAutoSaveStatus("error");
      autoSaveResetRef.current = setTimeout(() => setAutoSaveStatus("idle"), 3000);
      return { ok: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }, [getActiveShare, setConflict]);

  /**
   * Pre-populate lastShareResult with a known URL so a caller can open the
   * ShareModal without hitting the server. Used by read-only viewers who
   * want to share someone else's report via the existing share sheet UI.
   */
  const openShareSheetForUrl = useCallback((publicUrl: string) => {
    setLastShareResult({ updated: false, publicUrl });
  }, []);

  /** Whether this session has an active share. */
  const hasExistingShare = useCallback((): boolean => {
    return !!getActiveShare();
  }, [getActiveShare, setConflict]);

  /**
   * Fork an existing share: creates a new report owned by the current user
   * that tracks its lineage back to the source via forked_from_id.
   * Returns the new account-owned report ID on success.
   */
  const forkReport = useCallback(async (
    sourceId: string
  ): Promise<{ id: string } | null> => {
    try {
      const res = await fetch(`/api/share/${sourceId}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.id) return null;
      return { id: data.id };
    } catch {
      return null;
    }
  }, []);

  /** Clear active share session so the next Share creates a fresh link. */
  const clearStoredShare = useCallback(() => {
    try {
      localStorage.removeItem(SHARE_TOKENS_KEY);
    } catch {
      // ignore
    }
    activeEditTokenRef.current = null;
    activeShareIdRef.current = null;
    versionRef.current = 0; baselineRef.current = null; setConflict(null);
    setSessionShareId(null);
  }, []);

  return {
    conflict, getVersion, receiveRemote, resolveConflict,
    isSharedView,
    isSharePending,
    sharedState,
    shareId,
    editKeyFromUrl,
    copyShareUrl,
    autoSave,
    shareStatus,
    urlWarning,
    decodeFailed,
    isEditingUnlocked,
    isOwner,
    sessionShareId,
    lastShareResult,
    openShareSheetForUrl,
    hasExistingShare,
    clearStoredShare,
    fetchedIsPublic,
    fetchedIsUnlisted,
    fetchedCollaborators,
    autoSaveStatus,
    forkedFrom,
    forkReport,
    redactedFields,
  };
}
