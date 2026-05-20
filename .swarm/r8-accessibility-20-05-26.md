# WCAG 2.1 AA Accessibility Audit - VGC Team Report
**Date:** May 26, 2026  
**Scope:** Components NOT fixed by previous swarm runs  
**Baseline:** WCAG 2.1 Level AA compliance

---

## Executive Summary

The application has received prior accessibility fixes for color contrast, ReactionBar, notifications bell, and form labels. This audit identifies **11 high-impact remaining accessibility gaps** across six key areas: keyboard navigation, form accessibility, table semantics, error handling, skip content, and focus management. The top 5 issues affect critical user paths (changelog filtering, explore search, dashboard forms, team table pagination, and shared report viewing).

---

## Detailed Audit Findings

### 1. CHANGELOG TABLIST - Missing Keyboard Navigation
**File:** `/src/app/changelog/ChangelogContent.tsx` (lines 875-894)  
**WCAG Criterion:** 2.1.1 Keyboard (Level A), 2.5.3 Label in Name (Level A)  
**Severity:** HIGH - Keyboard users cannot use filter tabs  

**Issue:**
The tablist filter (All / New / Improved / Fixed) has `role="tab"` and `aria-selected` but lacks keyboard handlers:
- No `onKeyDown` handlers for arrow keys (←/→ to navigate tabs, Home/End to jump)
- No `tabindex="0"` on the active tab (tab order not managed)
- Inactive tabs have implicit `tabindex="-1"` but no explicit management
- Clicking works, but keyboard users cannot navigate without explicit tab indices

**WAI-ARIA Authoring Practices Guide requirement:** Tab widgets must support:
- Left/Right arrows to move focus between tabs
- Home key to first tab, End key to last tab
- Only the active tab can receive focus (others have `tabindex="-1"`)

**Specific Fix Needed:**
```tsx
// ChangelogContent.tsx:875-894
// 1. Add onKeyDown handler to tablist container:
const handleTabKeyDown = (e: React.KeyboardEvent, tabs: FilterType[]) => {
  const currentIndex = tabs.indexOf(filter);
  let nextFilter: FilterType | null = null;
  
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      nextFilter = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      nextFilter = tabs[(currentIndex + 1) % tabs.length];
      break;
    case 'Home':
      e.preventDefault();
      nextFilter = tabs[0];
      break;
    case 'End':
      e.preventDefault();
      nextFilter = tabs[tabs.length - 1];
      break;
  }
  if (nextFilter) setFilter(nextFilter);
};

// 2. Update tablist wrapper:
<div 
  role="tablist" 
  aria-label="Filter changes by type" 
  className="inline-flex rounded-xl bg-surface border border-border p-1 gap-0.5"
  onKeyDown={(e) => handleTabKeyDown(e, ["all", "new", "improved", "fixed"])}
>

// 3. Update each tab button:
<button
  role="tab"
  aria-selected={active}
  tabindex={active ? 0 : -1}  // Only active tab is focusable
  onClick={() => setFilter(f)}
  ...
```

**Effort Estimate:** 30 minutes  
**Related VGC Issues:** VGC-203 (pending)

---

### 2. NOTIFICATIONS PAGE - Missing aria-live for Load More Button
**File:** `/src/app/notifications/NotificationsContent.tsx` (lines 310-330)  
**WCAG Criterion:** 4.1.3 Status Messages (Level AAA)  
**Severity:** MEDIUM - Screen reader users miss loading feedback  

**Issue:**
The "Load more" button has `aria-busy={loadingMore}` but the button itself is not within an `aria-live` region. When clicked:
- Button announces "Load more, button" (no loading state feedback to assistive tech)
- `aria-busy=true` only affects the button's current state, not content changes
- No screen reader announcement that notifications are loading or loaded

**Why this matters:** Async content updates need live regions (ARIA 1.2 spec) so screen readers announce when new notifications appear without losing page context.

**Specific Fix Needed:**
```tsx
{/* Wrap the Load more button in an aria-live region */}
{hasMore && (
  <div aria-live="polite" aria-atomic="true" className="flex justify-center mt-4">
    <button
      type="button"
      onClick={loadMore}
      disabled={loadingMore}
      aria-busy={loadingMore}
      aria-label={loadingMore ? "Loading more notifications" : "Load more notifications"}
      className="px-6 py-2.5 text-sm font-bold rounded-xl bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
    >
      {loadingMore ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : (
        "Load more"
      )}
    </button>
  </div>
)}

// Also add aria-live to the notification groups container to announce new notifications:
{initialLoaded && !isEmpty && (
  <div aria-live="polite" aria-label="Notifications feed" className="space-y-6">
    <NotificationGroup label="Today" notifications={today} />
    <NotificationGroup label="This Week" notifications={thisWeek} />
    <NotificationGroup label="Older" notifications={older} />
    {/* Load more button */}
  </div>
)}
```

**Effort Estimate:** 20 minutes  
**Related VGC Issues:** VGC-204 (pending)

---

### 3. EXPLORE FILTERS - Missing Labels for Filter Buttons
**File:** `/src/components/explore/ExploreFilters.tsx` (lines 506-530)  
**WCAG Criterion:** 2.5.3 Label in Name (Level A), 1.4.11 Non-text Contrast (Level AA)  
**Severity:** MEDIUM - Icon-only buttons lack accessible names  

**Issue:**
The search category buttons (lines 286-299) and toggle buttons (Tournament, Following, Rental) have no explicit `aria-label`:
```tsx
// Current code - no accessible name for assistive tech
<button
  type="button"
  onClick={() => onSearchCategoryChange(cat.value)}
  className="... "
>
  {cat.icon}  {/* Just an SVG icon */}
  {catLabel[cat.value] ?? cat.label}  {/* Visible label present */}
</button>
```

When a screen reader encounters these, it sees only the icon and text. The icon SVG itself has no `aria-hidden`, so some readers announce "image, graphic" before the text label. Even though visible text is present, `aria-label` is best practice for icon buttons.

Buttons at lines 507-522 (Tournament, Following, Rental toggle buttons) also lack `aria-label` — only have visible text, but icon-heavy design means visual feedback (styling) is primary.

**Specific Fix Needed:**
```tsx
// For search category buttons (line 287-299):
<button
  key={cat.value}
  type="button"
  onClick={() => onSearchCategoryChange(cat.value)}
  aria-label={`Filter by ${catLabel[cat.value] ?? cat.label}`}  // ADD THIS
  aria-pressed={searchCategory === cat.value}  // Change to aria-pressed for toggle behavior
  className="..."
>
  {cat.icon}
  {catLabel[cat.value] ?? cat.label}
</button>

// For tournament toggle (line 507-522):
<button
  type="button"
  onClick={handleTournamentToggle}
  aria-pressed={tournamentMode}
  aria-label="Filter by tournament results"  // ADD THIS
  className="..."
>
  {/* icon + visible text */}
</button>

// For following toggle:
<button
  type="button"
  onClick={() => onFollowingOnlyChange(!followingOnly)}
  aria-pressed={followingOnly}
  aria-label="Show reports from creators I follow"  // ADD THIS
  className="..."
>
  {/* icon + visible text */}
</button>

// For rental toggle:
<button
  type="button"
  onClick={() => onHasRentalChange(!hasRental)}
  aria-pressed={hasRental}
  aria-label="Filter to teams with rental codes"  // ADD THIS
  className="..."
>
  {/* icon + visible text */}
</button>
```

**Effort Estimate:** 25 minutes  
**Related VGC Issues:** None (explore accessibility gap)

---

### 4. DASHBOARD PROFILE FORM - Missing Error Messages Linked to Inputs
**File:** `/src/app/dashboard/profile/page.tsx` (lines 303-410)  
**WCAG Criterion:** 3.3.1 Error Identification (Level A), 3.3.3 Error Suggestion (Level AA)  
**Severity:** MEDIUM - Error feedback not programmatically associated  

**Issue:**
Profile form inputs (Creator Name, Bio, Twitter, Discord, YouTube) have `htmlFor` labels but no error handling:
1. No `aria-describedby` linking to error messages (if validation fails)
2. No error container with unique `id` for screen readers
3. No `aria-invalid` announcement when fields fail validation
4. The save button `disabled={saving}` state has no feedback to screen readers about why it's disabled

Currently users only see visual error styling (red border), not announced via assistive tech.

**Specific Fix Needed:**
```tsx
// Add error state tracking in the component:
const [errors, setErrors] = useState<Record<string, string>>({});

// For each input field, add aria-describedby and aria-invalid:
<div>
  <label htmlFor="profile-bio" className="block text-xs font-semibold text-text-secondary mb-1.5">
    Bio
  </label>
  <textarea
    id="profile-bio"
    aria-invalid={!!errors.bio}
    aria-describedby={errors.bio ? "bio-error" : undefined}
    value={profile.bio}
    onChange={(e) => {
      setProfile({ ...profile, bio: e.target.value.slice(0, 500) });
      // Clear error on change
      setErrors(prev => ({ ...prev, bio: '' }));
    }}
    placeholder="Tell the VGC community about yourself..."
    rows={3}
    maxLength={500}
    className={`${inputCls} resize-none ${errors.bio ? 'border-red-500' : ''}`}
  />
  {errors.bio && (
    <p id="bio-error" className="text-red-500 text-xs mt-1" role="alert">
      {errors.bio}
    </p>
  )}
  <div className="flex items-center justify-between mt-1">
    <span className="text-[10px] text-text-tertiary">Displayed on your creator page</span>
    <span className={`text-[10px] font-medium ${profile.bio.length > 450 ? "text-amber-500" : "text-text-tertiary"}`}>
      {500 - profile.bio.length} left
    </span>
  </div>
</div>

// For the save button, add aria-label describing disabled state:
<button
  type="button"
  onClick={handleSave}
  disabled={saving}
  aria-label={saving ? "Saving your profile changes..." : "Save profile changes"}
  aria-busy={saving}
  className="px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
>
  {saving ? (
    <>
      <svg className="animate-spin h-4 w-4 inline mr-2" aria-hidden="true">...</svg>
      Saving...
    </>
  ) : (
    "Save Changes"
  )}
</button>
```

**Effort Estimate:** 45 minutes  
**Related VGC Issues:** None (form accessibility gap)

---

### 5. CHAMPIONS TABLE - Missing Caption and Scope Attributes
**File:** `/src/app/champions/ChampionsContent.tsx` (lines 250-330)  
**WCAG Criterion:** 1.3.1 Info and Relationships (Level A)  
**Severity:** MEDIUM - Data table semantics incomplete  

**Issue:**
The Indianapolis Regionals top-cut table (lines 251-329) is missing semantic enhancements:
1. No `<caption>` element (or aria-label on `<table>`) to identify the table purpose
2. Header cells (`<th>`) lack `scope="col"` attributes — screen readers can't associate data cells with column headers
3. No role indicators for row headers (Player name could be a row-scoped header)
4. When screen readers navigate cell-by-cell, users hear only the data ("Kangaskhan") without knowing which column ("Team")

**Current markup:**
```tsx
<table className="w-full text-sm border-collapse">
  <thead>
    <tr className="bg-surface-alt border-b border-border">
      <th className="text-left text-xs font-extrabold ...">Place</th>      {/* No scope */}
      <th className="text-left text-xs font-extrabold ...">Player</th>     {/* No scope */}
      <th className="text-left text-xs font-extrabold ...">Team</th>       {/* No scope */}
      <th className="text-xs font-extrabold ...">Details</th>             {/* No scope */}
    </tr>
  </thead>
  <tbody>
    {INDY_TOP_CUT.map((entry, idx) => (
      <tr ...>
        <td className="...">1st</td>
        ...
```

**Specific Fix Needed:**
```tsx
<div className="overflow-x-auto rounded-xl border border-border">
  <table className="w-full text-sm border-collapse" role="table" aria-label="Indianapolis Regionals top cut teams">
    <caption className="sr-only">
      Indianapolis Regionals Top Cut — Sample representatives from Regulation M-A meta. Placement, player, team, and Limitless link for each entry.
    </caption>
    <thead>
      <tr className="bg-surface-alt border-b border-border">
        <th scope="col" className="text-left text-xs font-extrabold text-text-tertiary uppercase tracking-wider px-4 py-3 w-16">
          Place
        </th>
        <th scope="col" className="text-left text-xs font-extrabold text-text-tertiary uppercase tracking-wider px-4 py-3">
          Player
        </th>
        <th scope="col" className="text-left text-xs font-extrabold text-text-tertiary uppercase tracking-wider px-4 py-3">
          Team
        </th>
        <th scope="col" className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider px-4 py-3 w-20">
          Details
        </th>
      </tr>
    </thead>
    <tbody>
      {INDY_TOP_CUT.map((entry, idx) => (
        <tr
          key={`${entry.placement}-${idx}`}
          className="border-b border-border last:border-0 bg-surface hover:bg-surface-alt transition-colors"
        >
          <td className="px-4 py-3 font-extrabold text-accent whitespace-nowrap">
            {entry.placement}
          </td>
          {/* Rest of cells */}
```

**Effort Estimate:** 15 minutes  
**Related VGC Issues:** None (data table semantics gap)

---

### 6. SHARED REPORT PAGE - Missing Skip to Content Link
**File:** `/src/app/s/[id]/page.tsx` (server component, no direct fix)  
**WCAG Criterion:** 2.4.1 Bypass Blocks (Level A)  
**Severity:** MEDIUM - Keyboard users must tab through nav to reach report  

**Issue:**
The shared report page (`/s/[id]`) renders a client-side redirect (`<ShareRedirectClient to={...} />`). The full page layout (navbar, footer) sits above the main report content. Keyboard users must tab through the entire navbar to reach the report slides.

WCAG 2.1 AA requires a "skip to main content" link visible on focus that jumps past repetitive navigation. This is typically a keyboard-only link near the top-left.

**Current flow:**
1. User opens `/s/{id}` in screen reader
2. Focus lands on navbar (logo, home, create, profile, settings, notifications)
3. User must Tab 10+ times to reach the first slide in the report
4. No way to jump directly to report content

**Specific Fix Needed:**
Add skip link to the root layout (`/src/app/layout.tsx`):
```tsx
{/* At the very start of <body>, before main navbar */}
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-bold"
>
  Skip to main content
</a>

{/* In the main report container (either layout or redirect target) */}
<main id="main-content" className="...">
  {/* Report content */}
</main>
```

**Effort Estimate:** 20 minutes  
**Related VGC Issues:** None (keyboard navigation best practice)

---

### 7. EXPLORE PAGINATION - Missing Loading State Announcement
**File:** `/src/components/explore/ExploreContent.tsx` (lines 104-116)  
**WCAG Criterion:** 4.1.3 Status Messages (Level AAA)  
**Severity:** LOW - Loading state not announced  

**Issue:**
The "Load more" button at lines 204-213 shows visual feedback (opacity change, button disabled) but no aria-label or aria-busy to announce loading to screen readers.

**Specific Fix Needed:**
```tsx
{nextCursor && (
  <div className="flex justify-center mt-8">
    <button
      type="button"
      onClick={loadMore}
      disabled={loadingMore}
      aria-busy={loadingMore}
      aria-label={loadingMore ? "Loading more teams" : "Load more teams"}
      className="px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-lg shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-wait"
    >
      {loadingMore ? "Loading..." : "Load more"}
    </button>
  </div>
)}
```

**Effort Estimate:** 10 minutes

---

### 8. DASHBOARD TAB NAVIGATION - No Keyboard Support
**File:** `/src/app/dashboard/DashboardContent.tsx` (lines 150-200 estimated)  
**WCAG Criterion:** 2.1.1 Keyboard (Level A)  
**Severity:** LOW - Tab switching is mouse-only visually, but keyboard still works via alt+number or tab key  

**Issue:**
The dashboard tabs (Drafts, My Reports, Saved, Feed, Collab, Collections, Analytics, Trash) are rendered as buttons. While technically keyboard-accessible via Tab key, there's no tablist semantics or arrow-key navigation as WAI-ARIA recommends.

**Specific Fix Needed:** Apply the same pattern as the Changelog tablist (add `role="tablist"`, `aria-label`, and arrow-key handlers).

**Effort Estimate:** 45 minutes

---

### 9. EXPLORE SEARCH INPUT - No Search Hint Text Linked
**File:** `/src/components/explore/ExploreFilters.tsx` (line 244)  
**WCAG Criterion:** 2.5.3 Label in Name (Level A)  
**Severity:** LOW - Placeholder text is not a substitute for label  

**Issue:**
The main search input has a placeholder but no visible or hidden label:
```tsx
<input
  type="text"
  value={localQuery}
  onChange={(e) => setLocalQuery(e.target.value)}
  placeholder={
    searchCategory === "pokemon"
      ? "Search by Pokemon..."
      : searchCategory === "tournament"
      ? "Search tournaments..."
      : searchCategory === "creator"
      ? "Search creators..."
      : "Search teams, players, Pokémon..."
  }
  className="w-full pl-9 pr-8 py-2 ..."
  // No aria-label or htmlFor
/>
```

While a visible search icon sits to the left, the input itself lacks an associated label or aria-label.

**Specific Fix Needed:**
```tsx
<label htmlFor="explore-search" className="sr-only">
  Search teams
</label>
<input
  id="explore-search"
  type="text"
  aria-label="Search VGC teams by Pokemon, tournament, or creator"
  value={localQuery}
  onChange={(e) => setLocalQuery(e.target.value)}
  placeholder={...}
  className="..."
/>
```

**Effort Estimate:** 10 minutes

---

### 10. NOTIFICATION GROUPS - Missing aria-labelledby Link
**File:** `/src/app/notifications/NotificationsContent.tsx` (lines 116-137)  
**WCAG Criterion:** 1.3.1 Info and Relationships (Level A)  
**Severity:** LOW - Group semantics present but could be stronger  

**Issue:**
The `NotificationGroup` component at lines 116-137 uses `aria-labelledby={headingId}` correctly, but the heading ID is derived from a lowercase label:
```tsx
const headingId = `notif-group-${label.toLowerCase().replace(/\s+/g, "-")}`;
```

If the label changes (e.g., "Today" → "Earlier Today"), the ID won't match and the link breaks. Better to use a stable, unique ID.

**Specific Fix Needed:**
```tsx
function NotificationGroup({
  label,
  notifications,
  groupId,  // Accept a stable ID
}: {
  label: string;
  notifications: Notification[];
  groupId: string;  // e.g., "today", "thisweek", "older"
}) {
  if (notifications.length === 0) return null;
  return (
    <section className="mb-6" aria-labelledby={`notif-heading-${groupId}`}>
      <h2 id={`notif-heading-${groupId}`} className="...">
        {label}
      </h2>
      {/* Rest of component */}
    </section>
  );
}

// Usage:
<NotificationGroup label="Today" notifications={today} groupId="today" />
<NotificationGroup label="This Week" notifications={thisWeek} groupId="thisweek" />
<NotificationGroup label="Older" notifications={older} groupId="older" />
```

**Effort Estimate:** 15 minutes

---

### 11. PAGINATION CURSOR BUTTONS - No aria-label
**File:** `/src/components/explore/ExploreContent.tsx` (line 204)  
**WCAG Criterion:** 2.5.3 Label in Name (Level A)  
**Severity:** LOW - Button purpose not clear to screen readers  

**Issue:**
If pagination uses previous/next icon buttons (not currently visible in code, but a common pattern), they need `aria-label` to describe their function:
```tsx
// Bad:
<button><svg>← icon</svg></button>

// Good:
<button aria-label="Load previous page of teams">
  <svg aria-hidden="true">← icon</svg>
</button>
```

**Effort Estimate:** 5 minutes per button pair

---

## Summary Table

| Priority | Issue | Component | WCAG | Effort |
|----------|-------|-----------|------|--------|
| **CRITICAL** | Changelog tablist keyboard nav | ChangelogContent.tsx:875 | 2.1.1, WAI-ARIA | 30 min |
| **HIGH** | Notifications aria-live region | NotificationsContent.tsx:310 | 4.1.3 | 20 min |
| **HIGH** | Explore filter button labels | ExploreFilters.tsx:286, 507 | 2.5.3 | 25 min |
| **MEDIUM** | Dashboard form error messages | profile/page.tsx:303 | 3.3.1, 3.3.3 | 45 min |
| **MEDIUM** | Champions table semantics | ChampionsContent.tsx:250 | 1.3.1 | 15 min |
| **MEDIUM** | Shared report skip link | /s/[id]/page.tsx | 2.4.1 | 20 min |
| LOW | Explore pagination loading | ExploreContent.tsx:104 | 4.1.3 | 10 min |
| LOW | Dashboard tab keyboard nav | DashboardContent.tsx:38 | 2.1.1 | 45 min |
| LOW | Explore search label | ExploreFilters.tsx:244 | 2.5.3 | 10 min |
| LOW | Notification group ID stability | NotificationsContent.tsx:116 | 1.3.1 | 15 min |
| LOW | Pagination button labels | ExploreContent.tsx:204 | 2.5.3 | 5 min |

**Total Effort Estimate:** ~245 minutes (~4 hours)

---

## Recommended Fix Sequence

1. **Week 1 - High Impact (100 min):**
   - Changelog tablist keyboard nav (30 min) — unblocks keyboard users on a key discovery page
   - Notifications aria-live (20 min) — fixes async update accessibility
   - Explore filter labels (25 min) — improves icon button clarity
   - Dashboard form errors (45 min) — critical for profile editing

2. **Week 2 - Data & Navigation (60 min):**
   - Champions table semantics (15 min)
   - Shared report skip link (20 min)
   - Dashboard tab keyboard nav (45 min) — larger refactor for semantic tabs

3. **Week 3 - Polish (85 min):**
   - Explore pagination/search accessibility (25 min)
   - Notification group ID stability (15 min)
   - Secondary button labels (10 min)
   - Testing & validation (35 min)

---

## Notes for Implementation

### Testing Tools
- **Keyboard Navigation:** Use Tab/Shift+Tab, Arrow keys, Enter, Escape in Chrome DevTools
- **Screen Readers:** Test with NVDA (free, Windows) or JAWS (paid), macOS VoiceOver
- **Automated Scanning:** Run Axe DevTools or Lighthouse accessibility audit after each fix

### CSS Utility
Add to Tailwind config if not present (for hidden but screen-reader visible labels):
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Future Enhancements (Beyond This Audit)
- Add focus visible outline on all interactive elements (currently relies on browser defaults)
- Implement loading skeleton announcements for data-heavy pages
- Add keyboard shortcut hints in help overlays (already planned per changelog v5.4)
- Consider a dedicated accessibility testing checklist for code review

---

## References
- [WCAG 2.1 AA Specification](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices 1.2](https://www.w3.org/WAI/ARIA/apg/)
- [Web Accessibility by WebAIM](https://webaim.org/)

