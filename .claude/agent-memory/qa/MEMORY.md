# QA agent memory

- [Ad-hoc Playwright scripts](feedback_adhoc_playwright_scripts.md) — no tsx/ts-node; use `node --experimental-strip-types`, `@playwright/test` exports `chromium` directly.
- [Locator scoping in modals](feedback_locator_scoping_modals.md) — scope to the front card (`z-10`) in FeedDetailModal/EntryDetailModal, broad selectors false-positive on decorative stack cards.
- [QA fixtures & environment quirks](project_cloud_qa_fixtures.md) — live seeded feed/calendar data (Aug 2026, 제주시 이도이동), no test login account, headless has no camera.
