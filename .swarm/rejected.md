# Rejected Changes

## swarm-og-page-unsuppress — src/app/s/[id]/page.tsx

**Reason:** High risk — reverted without committing.

The VGC-68 agent removed the `images: []` suppression from `s/[id]/page.tsx` and updated the comment. However, the original code contains a `// load-bearing` comment explaining that this was deliberately added after two previous failed attempts at OG images for share pages — both produced "image failed to load" unfurls in Discord due to edge runtime + sprite CDN + unfurler timeout issues.

**What to do:** The new `src/app/s/[id]/opengraph-image.tsx` (committed separately) implements a fallback card. A human reviewer should:
1. Test the OG image by sharing a `/s/[id]` URL in Discord/Twitter preview
2. If it renders reliably, update `s/[id]/page.tsx` to remove `images: []` and change `twitter.card` to `summary_large_image`
3. If it still breaks, keep the suppression and delete the opengraph-image.tsx

**Files affected:** src/app/s/[id]/page.tsx (reverted), src/app/s/[id]/opengraph-image.tsx (committed — the new implementation)
