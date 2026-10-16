# Changes Log

This file shows the **most recent fix only**. It is rewritten with each new fix so you always see the freshest change.

## How to read each entry

- **What:** Plain-English description of what was changed.
- **Why:** The bug or pain point that motivated the change.
- **How to check:** Steps you can do in the browser/terminal to confirm the fix works.
- **Code effect:** Which files changed and what those changes mean.
- **Vercel effect:** What happens when this change is pushed to production on Vercel.

---

## Trends page filled with sample calls

**Date:** 2026-10-13
**Files:** `scripts/seed-trend-calls.ts` (new), `package.json` (two new commands). No app code changed.

**What:** Added 14 sample calls to the database, spread over the past month, so **Training → Trends** shows all five charts instead of "No data yet". Nine calls sit in the older part of the month and five in the last week, written so the page tells a story: talking less, covering more discovery questions, landing the planned next step more often — with **Stage progression (60%)** left as the weakest number.

**Why:** Trends only counts calls that were planned, held and reviewed **in the last 30 days**, and its big headline numbers only use **the last 7 days**. The newest reviewed call in the database was from 13 August, so nothing was in range and the page had been blank since mid-September at the latest. Role plays do not feed this page at all — it is built from calls only.

**How to check:** Open `/training/trends`. Five charts, each with a percentage and a change figure, and "Computed from 14 calls in the last 30 days" at the bottom. `/training` shows three of the same charts. Checked in the browser on 2026-10-13.

**What else the sample calls touch:**

- **Calls list** and the pages of the ten sample customers used: the 14 calls appear there. Open any one to see its plan, notes and review.
- **Dashboard:** the "calls" count goes up by the sample calls in range.
- **Today page:** unchanged, on purpose. The sample calls create no follow-up tasks.
- **Product tour (Demo mode):** still lands on Bumimax, but its "AI debrief" step now opens the new sample call **Second cohort · Bumimax** instead of the 13 August call, because the tour always opens the most recently reviewed call.
- No existing call, customer or deal was edited. GoBeli got no sample calls so its "chase proposal" task on Today stays.

**It wears off:** this is a rolling window. In about a week the big percentages go back to "—", and in about a month the charts are empty again, unless real calls are reviewed in the meantime. To re-date the sample calls to today, run `npm run trends:refresh` in this folder (safe to repeat — it replaces its own 14 calls and nothing else). To remove them completely: `npm run trends:clear`.

**Code effect:** One new script. It builds each call's plan and review, checks them against the same rules the app uses, and lets the app's own scoring function work out the numbers — so opening a sample call shows details that match its chart points. Every sample call's id starts with `demo_trend_`, which is how refresh and clear find them.

**Known quirk (not changed):** Talk balance shows its change in red ("-13pp") even though dropping into the 30–40% target is an improvement. The page colours any drop red.

**Vercel effect:** No code to deploy for the page itself. The sample calls live in the database, so if the live site uses the same database as this computer, they show there too.

---

*Earlier the same day:*

## "Drills" renamed to "Role play", and you now choose what to practice

**Date:** 2026-10-13
**Files:** `components/training/DrillForm.tsx`, `lib/ai/scenario-generator.ts`, `lib/schemas/drill.ts`, the pages under `app/(dashboard)/training/`, `components/Sidebar.tsx`, `next.config.ts`, plus small wording changes in the playbook, dashboard and Movie Mode files.

**What:** Two things.

1. **Renamed.** Everything a person can see that said "Drill" now says "Role play" — the side menu, page titles, buttons, the streak messages, the playbook labels and the Movie Mode demo slide. The page address changed too: `/training/drills` is now `/training/role-play`. Old links and bookmarks still work; they forward to the new address.
2. **You choose what to practice.** Before a role play starts you now get a "What do you want to practice?" step with three ways to choose:
   - tap a ready-made situation (four per topic, e.g. "Asking for a discount", "Two days is too long"),
   - type your own situation in your own words, or
   - leave it on **Surprise me**, which behaves exactly like before.

   After each round there are two buttons: **Another one like this** (same situation, fresh customer line) and **Choose something else** (back to the picker).

**Why:** "Drill" is not a word Malaysian sales teams use; "role play" is. "Training" was the other candidate but it is already the name of the whole section, so the menu would have read Training → Training. And before this change the AI picked the customer objection at random inside a topic, so there was no way to rehearse the one objection you actually expected on your next call. The big **Drill now** button on the Training page also jumped straight into your weakest topic without asking.

**How to check:**

1. Open `/training`. The top-right button now says **Start role play** and takes you to the topic list instead of straight into a topic. The streak box still has its one-click shortcut (**Practice Budget**, or whichever topic is weakest).
2. Click **Role play** in the side menu, open **Budget**, tap **Asking for a discount**, press **Start role play**. The customer line should be someone asking for a discount, with "Practicing: Asking for a discount" shown above it.
3. Press **Choose something else**, type your own situation (for example "They want to pay only after the workshop is finished") and press Enter. The customer line should follow what you typed.
4. Visit the old address `/training/drills` — it should land on `/training/role-play`.

All four were checked in the browser on 2026-10-13. No role play was graded during testing, so no scores, streaks or history were touched.

**Code effect:** Wording and one new input. The chosen situation is passed to the AI as extra guidance for that one scenario; it is trimmed to 200 characters and run through the same privacy scrubber (emails, phone numbers, IC numbers) used elsewhere before it leaves the machine. Nothing new is saved and the database is unchanged — the internal table and code names still say "drill", which nobody sees. One small bonus fix: if the AI fails to produce a scenario, the reason is now shown on the picker; before, the screen silently went back to the start button.

**Not changed (your call):** the four topics are still called "buckets" in a few sentences ("Weakest bucket right now", "Your best in this bucket"). That is the same kind of insider word as "drill" and could become "topic" in one pass.

**Still open from the previous entry (13 Aug):** the **Dry run** button on a call page builds its scenarios with the same AI but without the length limits and retry that fixed **Start drill**, so it is probably still failing more often than it should. Not changed here.

**Vercel effect:** Nothing goes live until this is pushed. When it is, it works immediately — no database or settings changes. The forwarding of the old `/training/drills` address is part of the site settings file and applies on the same deploy. AI cost per role play is unchanged.
