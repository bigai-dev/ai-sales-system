# Changes Log

This file shows the **most recent fix only**. It is rewritten with each new fix so you always see the freshest change.

## How to read each entry

- **What:** Plain-English description of what was changed.
- **Why:** The bug or pain point that motivated the change.
- **How to check:** Steps you can do in the browser/terminal to confirm the fix works.
- **Code effect:** Which files changed and what those changes mean.
- **Vercel effect:** What happens when this change is pushed to production on Vercel.

---

## Hide the disabled "Group by rep" button on /pipeline

**Date:** 2026-05-12
**Files:** `components/views/PipelineView.tsx`

**What:** Removed the "Group by rep" button from the pipeline page header.

**Why:** The button was an unclickable placeholder — author wired it as disabled with a tooltip *"Available with a team plan — currently you're the only rep"*. With a single-rep setup it's just visual noise; users hover, find it disabled, and wonder why it's there.

**The fix:**

```diff
- <button
-   className="btn-ghost opacity-50 cursor-not-allowed"
-   disabled
-   title="Available with a team plan — currently you're the only rep"
- >
-   Group by rep
- </button>
```

**How to check:** Open `/pipeline` → the header now shows only **Filter** and **+ New workshop deal** to the right of the title.

**Code effect:** One 7-line block deleted from `PipelineView.tsx`. No imports change, no behavior change. When a second rep is added in the future, restore the button and wire it to filter by `ownerRepId`.

**Vercel effect:** Pure UI cleanup, works immediately on deploy.
