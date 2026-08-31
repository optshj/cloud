---
name: feedback-verify-in-browser-not-guess
description: For visual/CSS bugs in this project, measure the actual rendered DOM (Playwright bounding rects/computed styles) instead of reasoning from source code alone
metadata:
  type: feedback
---

When asked to fix a visual bug (e.g. calendar month-grid thumbnails "찌그러지고 지저분해 보인다"), the user explicitly required running the local dev server and confirming the real cause by rendering — not fixing based on a plausible-sounding read of the CSS classes.

**Why:** the user's own hypothesis in the task description (adjacent-cell `-inset-1` overlap causing squish) was reasonable-sounding but wrong. The actual root cause — confirmed only via `page.$$eval(...).getBoundingClientRect()` — was a Tailwind cascade conflict (`relative` vs `absolute` both in a merged className string; declaration order in the generated stylesheet decides the winner, not string order), which collapsed the box to ~10px tall rather than causing an overlap. Only after fixing that did the *second*, real overlap issue (`-inset-1` > `gap-1`) become visible. Guessing from the code alone (as the user's own bug report did) would have produced a plausible-but-wrong fix (e.g. just tuning z-index/overlap amount) that left the actual collapse bug in place.

**How to apply:** For any layout/CSS bug report in this project, spin up (or reuse an already-running) `npm run dev` and use Playwright (`node_modules/.bin/playwright` is installed, `@playwright/test` in package.json) to script a quick inspection: navigate, `getBoundingClientRect()` on the relevant elements, dump `outerHTML`/computed styles, and take zoomed screenshots (`deviceScaleFactor` + `clip`) before concluding on a root cause. Don't stop at "the code reads like X would cause Y" — check what the browser actually computed. This is a one-off inspection script in the scratchpad, not a committed test file.

Related: also double-check secondary suspicions the same way — e.g. this session briefly suspected Tailwind v4's `rotate-2` utility wasn't applying at all (`getComputedStyle().transform` was `"none"`), which would have been a false lead; checking `getComputedStyle().rotate` directly showed it was in fact `-2deg` — Tailwind v4 uses native CSS `rotate`/`scale`/`translate` properties instead of the `transform` shorthand, so `.transform` alone is not a reliable signal for whether these utilities applied.
