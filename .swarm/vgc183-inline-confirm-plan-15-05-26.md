# VGC-183: Replace window.confirm with Inline Confirmation

## 1. Exact window.confirm Location

**File:** `src/components/match-tracker/MatchTracker.tsx`
**Line:** 96

```ts
if (!window.confirm("Delete this match entry?")) return;
```

## 2. Delete Function It Guards

`handleDelete` (lines 95–105) is a `useCallback` that:
1. Calls `window.confirm("Delete this match entry?")` — blocks on iOS PWA / Android WebView / some browsers, silently no-ops
2. On confirmation, fires `DELETE /api/match-log?id=<id>`
3. On success, calls `fetchStats()` to refresh the log list

The trash icon button (line 429–442) sits inside each `.map` row of the "Recent Matches" list. It has `aria-label="Delete match entry"` and is currently hidden via `opacity-0 group-hover:opacity-100 focus:opacity-100`.

## 3. Proposed Inline Confirmation Approach

### State: single `pendingDeleteId: string | null`

Add one state variable to `MatchTracker`:

```tsx
const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
```

### Interaction flow

1. User taps trash icon → `setPendingDeleteId(log.id)` (no dialog, no `window.confirm`)
2. That row's trailing area morphs inline into two buttons:
   - **"Delete"** (red): calls the real `handleDelete(id)`, then `setPendingDeleteId(null)`
   - **"Cancel"** (ghost): calls `setPendingDeleteId(null)`
3. Any other row that still shows the trash icon operates normally; only one row at a time is in confirm state
4. Clicking/tapping outside the row does NOT auto-dismiss (keep it simple — user must press Cancel; this avoids accidental dismissal)

### Updated `handleDelete`

Remove the `window.confirm` guard. The function becomes purely the fetch:

```ts
const handleDelete = useCallback(async (id: string) => {
  setPendingDeleteId(null);
  try {
    const res = await fetch(`/api/match-log?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) await fetchStats();
  } catch { /* best-effort */ }
}, [fetchStats]);
```

### Row render logic (per log)

```tsx
{logs.slice(0, 5).map((log) => {
  const isPending = pendingDeleteId === log.id;
  return (
    <div key={log.id} className="group flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-surface-alt/50 transition-colors">
      {/* ... existing W/L/T + archetype + date spans ... */}

      {isPending ? (
        <div className="flex items-center gap-1 flex-shrink-0" role="group" aria-label="Confirm delete">
          <button
            type="button"
            onClick={() => handleDelete(log.id)}
            aria-label="Confirm delete match entry"
            className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-[10px] font-bold rounded-md bg-red-500 text-white hover:bg-red-600 active:scale-[0.97] transition-all cursor-pointer"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setPendingDeleteId(null)}
            aria-label="Cancel delete"
            className="min-h-[44px] min-w-[44px] px-2 py-1 text-[10px] font-bold rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPendingDeleteId(log.id)}
          aria-label="Delete match entry"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center p-1 rounded text-text-tertiary hover:text-red-500 transition-all cursor-pointer"
        >
          {/* trash SVG */}
        </button>
      )}
    </div>
  );
})}
```

## 4. Shared Modal Component vs Inline State

**Decision: Inline state in MatchTracker — no new shared component.**

Rationale:
- The dashboard (`DashboardContent.tsx` lines 537 / 661–709) already uses the same pattern: a `deleteStep: 0 | 1 | 2` state variable that swaps the trash icon for inline Confirm/No buttons — all local to `ManagedReportCard`, no shared modal
- The match tracker is a single self-contained component; a shared `ConfirmDialog` would add indirection with no reuse benefit yet
- A portal/modal for a simple "yes/no" on a list row is heavy UX for mobile — inline is faster and more thumb-friendly
- Keeps the fix small and reviewable (~30 lines changed)

## 5. Key UI/UX Requirements

| Requirement | Implementation |
|---|---|
| **44px touch targets** | `min-h-[44px] min-w-[44px]` on both Delete and Cancel buttons, and on the trash icon button |
| **Accessible** | `role="group" aria-label="Confirm delete"` on the wrapper; each button has an explicit `aria-label` |
| **Keyboard navigable** | Both buttons are native `<button>` elements — focus order is natural (Tab moves Delete → Cancel → next row element); Escape is NOT wired (no modal, so no trap needed) |
| **One pending row at a time** | `pendingDeleteId` is a single string — selecting a new row implicitly cancels any prior pending state |
| **Consistent with codebase** | Mirrors the `deleteStep` pattern in `DashboardContent.tsx`; same Tailwind token conventions (`bg-red-500`, `text-text-tertiary`, `hover:bg-surface-alt`) |
| **No window APIs** | Zero usage of `window.confirm`, `alert`, or `prompt` — works in all PWA/WebView environments |
| **Reduced motion safe** | Only `transition-all` used, no keyframe animations; fully safe for `prefers-reduced-motion` |
