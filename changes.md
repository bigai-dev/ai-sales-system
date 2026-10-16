# Changes Log

This file shows the **most recent fix only**. It is rewritten with each new fix so you always see the freshest change.

## How to read each entry

- **What:** Plain-English description of what was changed.
- **Why:** The bug or pain point that motivated the change.
- **How to check:** Steps you can do in the browser/terminal to confirm the fix works.
- **Code effect:** Which files changed and what those changes mean.
- **Vercel effect:** What happens when this change is pushed to production on Vercel.

---

## The clean-up: one set of words, one look, a simpler menu

**Date:** 2026-10-16
**Files:** most of `app/` and `components/`, plus `lib/constants/` (new `copy.ts` and `routes.ts`, bigger `labels.ts`), `next.config.ts`, `README.md`. Saved as eight checkpoints (`git log`), one per phase.

**What:**

1. **One set of words everywhere.** Deal stages are now New lead → Qualified → Discovery → Proposal → Negotiation → Won (no more S/P/A/N/C/O letters, "Suspect", "Order" or "Closed-won" on screen). A client's stage now follows its deals instead of being a separate field. The readiness feature is called **Readiness check** in every place (menu, buttons, client page, timeline, copied text, PDF). "Briefing" is **Call plan**, "Debrief" is **Call review**, "Dry run" is **Role-play this call**, "bucket" is **topic**, "grade" is **score**. Developer words (LLM, DeepSeek, TCV, pp, SPANCO, rate-limit, "Unscoped call", "LLM call failed: …") no longer appear; AI errors read like "Couldn't plan this call. Try again."
2. **A simpler menu.** Today is now the home page (`/`). The menu is Today · Dashboard · Clients · Deals · Calls, then Training · Role play · Playbook. Readiness checks live under Clients (`/clients/readiness`). Trends merged into the Training page. The two demo buttons that sat on every page moved into one small **Demo** menu at the bottom of the sidebar (Guided tour, Present full screen). The top bar is gone, so every page has one title instead of two.
3. **One look.** Buttons are sentence case (no more small ALL-CAPS text anywhere), one card style, one page header, one text-input style, one empty-state box, one error style, no emoji. Icons come from a small icon set instead of hand-drawn ones. The sidebar's active item is a quiet bar instead of a solid orange pill.
4. **Simpler pages.** Client page: three numbers instead of four, no duplicate "Engineering profile" box, deals listed with a stage picker and a delete button, proposals can be written from the client page. Readiness page: one summary panel, six area cards, a risks list, next steps. Dashboard: the calls chart now shows real planned/completed calls per week (it was fixed sample numbers), the stage funnel is built from deals and links to the board, and the coaching box can finally find your reviewed calls. Today: Snooze/Done are always visible (they used to appear only on hover, so touch screens couldn't reach them). Calls: you can plan a call from the Calls page by picking a client.
5. **Loading and error screens.** Pages show grey placeholders while loading, and a friendly "Something went wrong · Try again" box if a page breaks.

**Why:** The app had the same thing named up to eight different ways, two different stage lists shown side by side, and no shared building blocks, so every page looked and read slightly differently. Twenty-odd small bugs were fixed along the way (see the commit messages).

**How to check:**

1. Open `/`. It's Today. The menu on the left has 5 + 3 items and a **Demo** button at the bottom.
2. Open `/deals`. Columns read New lead … Won. Drag a card; the client's page shows the new stage.
3. Open any client. Three numbers, Discovery, Deals (with a stage picker), Timeline, Calls, Proposals. Press **Run readiness check**, then **Generate proposal** from the client page.
4. Open a call. Panels are **Call plan**, **Notes**, **Call review**. The **Role-play this call** button sits in the call plan.
5. Old addresses still work: `/today`, `/pipeline`, `/health-check`, `/clients/<id>/health-check`, `/training/trends` all forward.
6. Demo → Guided tour runs end to end; Demo → Present full screen opens the slideshow.

Checked in the browser on 2026-10-16 in light mode. Not checked: dark mode on every page, and the AI features themselves were not run (they cost tokens), only their wording and error paths.

**Code effect:** All user-facing words live in `lib/constants/labels.ts` and `lib/constants/copy.ts`; all page addresses in `lib/constants/routes.ts`. Shared screen pieces live in `components/ui/`. The database is unchanged: stage codes, statuses and the `health_checks` tables are the same; three never-used tables (`script_templates`, `call_turns`, `call_tips`) are marked as unused in `db/schema.ts` so they can be dropped in one migration later. `lucide-react` (icons) was added. Pre-existing lint notes in `ThemeToggle`, `TourOverlay`, `app/layout.tsx` and `public/theme-init.js` were left as they were.

**Dashboard numbers changed on purpose:** "Deals by stage" now adds up deals, not client values, so the totals differ from before and match the Deals board.

**Vercel effect:** Nothing goes live until this is pushed. No database or settings changes are needed. The old-address forwarding lives in `next.config.ts` and applies on the same deploy.
