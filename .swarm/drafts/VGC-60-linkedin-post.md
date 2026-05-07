# VGC-60: LinkedIn Post — Solo Dev Workflow Powered by Claude Code

**DRAFT ONLY — Do not publish**

---

## Post Draft

---

I ship more features alone than most 5-person teams. Here's how.

Six months ago I started building VGC Team Report — a tool for Pokemon Video Game Championship players to build, analyse, and share their competitive teams. It's live at vgc-team-report.vercel.app. I built it alone, around a day job, with Claude Code as my AI pair programmer.

Here's what that workflow actually looks like in practice:

**The stack is modern and intentional.** Next.js 16, React 19, TypeScript, Tailwind CSS v4, deployed on Vercel. Every push to `main` auto-deploys to production, so I only push when I'm confident. I run `tsc --noEmit` and `npm run build` locally before every commit. No broken deploys.

**Linear does the thinking I don't have bandwidth for.** Every feature, bug, and idea lives as a Linear ticket. When I open a new session, Claude checks what's In Progress and starts working through the queue automatically — no briefing needed. Bugs first, then by priority. Multiple tickets land in a single batched push to keep Vercel build minutes inside budget.

**Overnight swarm agents changed everything.** I'll queue up 6–8 tickets before I go to sleep. By morning there are staged commits, updated Linear tickets, and Discord build notifications waiting for me. I review, give the push signal, and ship. One person. One build. Done.

**The honest part:** AI doesn't replace judgment. I still make every architectural call, review every diff, and own every production bug. But the gap between "idea" and "shipped" collapsed from days to hours.

If you're a solo indie dev still writing every line manually, I'd genuinely encourage you to try this model. The leverage is real.

What's your AI-first development setup? I'd love to hear how others are structuring this.

#indiedev #buildinpublic #AI #NextJS #Pokemon #VGC #solofounder

---

*Word count: ~280*
