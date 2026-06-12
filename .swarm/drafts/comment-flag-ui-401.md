# [BUG] CommentSection flag button silently swallows the new 401 for anonymous users

**Priority:** Medium
**Labels:** auto-research, bug

## Context

In this swarm run (12-06-2026), `/api/comments/flag` was hardened to require Clerk authentication (security ticket SEC-FLAG-AUTH — anonymous flagging let attackers rotate session IDs to auto-delete comments). The route now returns `401 { error: "Authentication required to flag comments" }` for unauthenticated requests.

However, `src/components/social/CommentSection.tsx:136-154` still:
- Sends the flag request without checking sign-in state
- Silently swallows the error in the `.catch()` handler

Result: anonymous users tap "flag", get a 401, see no feedback, and the button does nothing.

## Fix options

1. Wrap the flag button in `<SignedIn>` from `@clerk/nextjs`, so it only renders when authenticated.
2. OR: on click, check sign-in state and either open the Clerk sign-in modal or show a "Sign in to flag" toast.

Option 1 is the cleanest — anonymous users can still see comments, just can't flag them, which is the intended new behaviour.

## Verify

After fix, anonymous users should not see the flag button at all (or should see a clear sign-in prompt when they tap it).
