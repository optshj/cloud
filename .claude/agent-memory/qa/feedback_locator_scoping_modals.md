---
name: feedback-locator-scoping-modals
description: Scope Playwright locators to the front card wrapper in FeedDetailModal/EntryDetailModal — broad selectors can false-positive on decorative stacked cards
metadata:
  type: feedback
---

`FeedDetailModal` (`src/widgets/entry-card/ui/FeedDetailModal.tsx`) renders decorative "카드 더미" stack cards (other entries, `aria-hidden`, `z-0`) behind the real front card (`z-10`). A broad locator like `page.locator('button:has(svg)').filter({ hasText: /^\d+$/ })` can resolve to the wrong element or get blocked by an overlapping `<img>` from the stack, producing a false "click failed / intercepted" result that looks like an app bug but isn't.

**Why:** hit this during a QA pass on 2026-09-01 — a naive like-button locator timed out with "element intercepts pointer events," which first looked like a real z-index bug. Re-scoping the locator to `div.relative.z-10` (the front card) and searching within it found the real button immediately and the click worked correctly (triggered the Kakao login redirect for a logged-out like, as `docs/FLOWS.md` §4 describes).

**How to apply:** when testing FeedDetailModal or EntryDetailModal interactions with Playwright, scope locators to the front card wrapper first, then query inside it — don't rely on `.first()` over a page-wide selector when stacked/decorative duplicate markup is present.
