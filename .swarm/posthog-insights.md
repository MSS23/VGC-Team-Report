# PostHog Insights — 12-06-2026

**Status:** ❌ POSTHOG CREDENTIALS NOT AVAILABLE in environment.

No `.env.local` file. No `POSTHOG_API_KEY` or `POSTHOG_PROJECT_ID` in environment.

Cannot pull live exception, rage-click, funnel, or page-view data this run. Subagents fed this file should rely on static analysis + research only.

This is a recurring limitation (logged on every prior run since May 22). A draft Backlog ticket recommends adding a read-only PostHog "swarm" personal API key to the deploy environment so future runs can pull insights without human assistance — `.swarm/drafts/infra-posthog-credentials.md`.
