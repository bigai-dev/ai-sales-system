# Movie Mode — Webinar Demo (Design)

**Date:** 2026-06-02
**Goal:** Make SALES.AI land hard in a live webinar that sells the *2-day vibe-coding workshop* to the general public.

## The pitch we're proving

> "Don't buy someone else's sales software. With AI, you build your own — shaped exactly to how YOU sell. When you do, two magic things happen: every sale becomes **trackable**, and your hard-won **sales techniques get captured and passed on** to anyone you hire."

The app is **Exhibit A** — proof that a non-coder built a real, working system with AI. The single most unique claim (and the demo's climax) is **skill transfer**: the AI captures how the best closer sells and trains the next person on it. No off-the-shelf tool does that.

## The problem with the current demo

- ~10 screens; the genuine magic is buried 3 clicks deep in detail pages.
- The existing "tour" is **tooltips floating over busy CRM screens** — the audience's eye lands on clutter and jargon ("SPANCO", "SST invoice", "readiness index"), not the magic.
- AI is real but slow live (10–20s) and can fail on bad wifi — fatal for a live room.
- No single staged "wow"; the demo wanders instead of landing a punch.

## The solution: "Movie Mode"

A **full-screen, keynote-style, click-through story** that replaces wandering with a fixed, bulletproof path. Press **→** to advance and narrate. No menus, nothing to mis-click, nothing to break.

### Design principles

1. **One screen, one message, one piece of magic** per scene. Big type, minimal chrome — looks like a keynote, not a CRM.
2. **Pre-baked AI, instant reveal.** AI output is generated ahead of time and stored. On click: ~1.5s "AI is thinking…" shimmer, then the real result animates in. It IS the genuine AI output — we just don't gamble on a live wait. (Optional "run it live" button kept for proof, off by default.)
3. **One hero company throughout** so it's the same perfect story every time: **Bumimax Industrial Bhd** (buyer: Anitha; CTO: Tan Wei Loon; 18 engineers; ERP-migration timing tension; already has a real closed-won call + AI debrief in the seed data).
4. **Plain language + real local detail.** No internal jargon on screen. Keep authentic Malaysian money: **RM 3,500/pax + 8% SST**, and the SST tax invoice.
5. **Don't break what exists.** The current tooltip tour stays for self-guided exploring. Movie Mode is a new, separate, full-screen experience launched from one **"Present"** button.

### The story — one deal, start to finish (~8 scenes, ~6 min)

| # | Scene (full screen) | On-screen content | Narration beat | Proves |
|---|---|---|---|---|
| 1 | **Title card** | "I built this sales system with AI — shaped to exactly how I sell." | The hook. | Frame |
| 2 | **The prospect** | Bumimax at a glance: who they are, goals, pain, budget — captured automatically. | "Everything I know, in one place." | *Trackable* |
| 3 | **AI preps my call** | Pre-baked briefing: my objective, questions to ask, objections coming, how to answer. | "One click and the AI coaches me before I dial." | AI does prep |
| 4 | **The call** | Short, readable highlight of the conversation (a few key turns / live tips). | "We talk. Every word captured." | *Trackable* |
| 5 | **AI writes it up** | Pre-baked debrief: what was agreed, the objection raised, the next step + a ready follow-up email. | "Call's done. AI wrote the summary and the email. I typed nothing." | AI does admin |
| 6 | **AI writes the proposal** | Pre-baked, tailored 2-day workshop proposal — priced (RM 3,500/pax + 8% SST), scheduled, mapped to their pain. | "One click — a full proposal." | AI does selling |
| 7 | 🎯 **Skill transfer (CLIMAX)** | The AI pulls the winning line from the call ("recap discipline — verbally summarized the 3 commitments") → saves it to the playbook → turns it into a 2-minute drill for the next hire. | "Here's what you can't buy: my skill is now transferable. My next hire practices MY moves." | **The unsee-able moment** |
| 8 | **Close card** | "Lead → close → and a system that trains the next person. I built this with AI. In 2 days, you build yours." | The CTA to the workshop. | Conversion |

## What gets built

- A new **full-screen Movie Mode** component, launched by a single **"Present"** button.
- Reuses the existing keyboard controls (**→ / ← / Esc**) so it feels familiar.
- **8 hand-crafted scenes**, each rendering real (pre-baked) AI output for Bumimax.
- A small store of pre-baked AI results (briefing, debrief, email, proposal, winning line, drill) keyed to the hero client, so reveals are instant and identical every run.
- The existing tooltip tour (`TOUR_STEPS`, `TourProvider`, `TourOverlay`) is left intact.

## Explicitly out of scope (for now)

- Decluttering / renaming the real app screens (that was the "clean the house" option — skipped to keep the build focused before the webinar).
- Live AI during the demo (kept available as an optional toggle, not the default path).
- Any change to the underlying data model or AI logic.

## Success criteria

- The whole story runs on **arrow keys only**, full-screen, with zero navigation into raw CRM screens.
- Every AI reveal appears in **under ~2 seconds** and is identical on every run (no live API dependency, no failure on bad wifi).
- A non-technical viewer can follow the story and articulate the three claims afterward: **custom-built, trackable, transferable.**
- The climax (scene 7) clearly shows a real call turning into a reusable drill for a future hire.
