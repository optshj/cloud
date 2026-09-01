---
name: feedback-adhoc-playwright-scripts
description: How to run one-off .qa.ts Playwright scripts in the cloud repo without adding new dependencies
metadata:
  type: feedback
---

No `tsx`/`ts-node` is installed in `cloud`, and `npx tsx ...` prompts to install it (blocks non-interactively). Do not add it as a dependency just for QA scripts.

**How to apply:** run ad-hoc `e2e/qa/*.qa.ts` scripts with Node's native TS stripping instead: `node --experimental-strip-types e2e/qa/<script>.qa.ts` (repo's Node is v24, which supports this natively). Two things the script itself needs:
- `@playwright/test` exports `chromium`/`firefox`/`webkit` directly — `import { chromium } from "@playwright/test"` works standalone, no need for the `playwright` package or the test runner.
- The script runs as ESM (node warns and reparses when it detects `import`), so `__dirname` is undefined — derive it with `path.dirname(fileURLToPath(import.meta.url))` instead of relying on CJS globals.

**Why:** avoids an interactive npm prompt that can't be answered in this harness, and avoids adding a devDependency the project doesn't otherwise want. See also [[project-cloud-qa-fixtures]] for what test data is already live during a QA pass.
