# DRAFT ONLY — NOT SENT

Unsent draft copy for the feedback-loop-closing opportunity (#1 in `.swarm/r3-r5-ux-research.md`).
**Nothing here has been emailed, posted or submitted anywhere.** No outbound request was made this run.
A human should review, edit and send these — or decide not to.

Verify each "shipped" claim against current `main` before sending; claims below are from git log at
commit `70c4633` (2026-10-05).

---

## Draft A — to João Ludgero / LudgeroVGC (`ludgero97@gmail.com`)
Re: VGC-238, 239, 240, 244, 249, 250

> Subject: Your VGC Team Report feedback — three of your requests are live
>
> Hi João,
>
> You've sent the most detailed feedback this tool has had, and a lot of it has shipped. Closing the loop:
>
> - **Team Modes** (your VGC-239 request) is live — you spotted it yourself, thank you for saying so.
> - **The Mega speed-tier toggle** now actually recalculates speed. You were right that it was doing nothing;
>   it was fixed in July.
> - **The stat-bar colours** were the confusion you flagged: the colour is just the stat type, never a quality or
>   percentile ranking. There's now a caption saying so, and it can be dismissed once you've read it.
>
> Still open, and genuinely under consideration rather than politely filed:
>
> - **Modes above Leads.** You argued both sides — nest leads inside modes, or collapse the two. We're deciding;
>   your reasoning that "the Mode is superior to the Lead" is the framing we're working from.
> - **Tournament info as metadata rather than the lead section.** This is the most useful thing you've sent us.
>   "Could Aaron Zheng use this page while introducing a team on YouTube?" has become an internal test. It's a
>   bigger change than it looks (the same team across several tournaments is a data-model question), so it isn't
>   a quick one — but it's not forgotten.
> - **The CybertronVGC lead-slide format.** Noted, including that it's close to the existing Match-Ups layout.
> - **Replay uploads.** Your question — if it isn't trying to be VS Recorder, why is it here? — is a fair one and
>   we're answering it properly rather than guessing.
>
> On continuity: noted, and taken seriously.
>
> Thank you for the Excel-spreadsheet comment. That's exactly the job this is meant to do.

---

## Draft B — to Poke Peak (`pokepeakvgc@gmail.com`)
Re: VGC-252, VGC-263

> Subject: Both of your reports are fixed
>
> Hi,
>
> Two for two:
>
> - **The bar-colour note** can now be dismissed with the × next to it, and it stays hidden.
> - **Levitate** now shows a Ground immunity on the defensive type chart — along with Flash Fire, Earth Eater,
>   Well-Baked Body, Volt Absorb, Lightning Rod, Motor Drive, Water Absorb, Storm Drain, Dry Skin and Sap Sipper.
>
> Your Levitate report also led us to a related bug you hadn't hit yet: with a Mega toggled on, the coverage chart
> was still using the *base* form's typing and ability — so Mega Gengar was showing Levitate's Ground immunity even
> though it has Shadow Tag. That's on the list because you reported the first one.
>
> Thanks — short, specific reports like these are the easiest kind to act on.

### Caveat to check before sending Draft B
The dismissal in `StatColorNote.tsx` persists to `localStorage`, so it is **per browser/device**, not an
account-level setting. The user asked for "a setting." If that distinction matters, soften the wording or ship
opportunity #7 first.
