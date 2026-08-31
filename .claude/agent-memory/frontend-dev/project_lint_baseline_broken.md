---
name: project-lint-baseline-broken
description: npm run lint fails repo-wide (~257 errors) even on clean main, independent of any single diff — check baseline before blaming your own change
metadata:
  type: project
---

As of 2026-08-31 (commit `3275c1d`), `npm run lint` fails with ~257 errors across nearly every file in `src/`, confirmed via `git stash` (errors are identical on unmodified `main`). Two systemic causes observed:

1. Most existing components use `export function X(...)` instead of the arrow-function style `eslint.config.mjs`'s `no-restricted-syntax` rule requires (`const X = () => {}`). This convention isn't actually followed in most of the codebase yet.
2. `eslint.config.mjs` does not register a `@next/next` plugin in its `plugins: {}` block, but several files carry `// eslint-disable-next-line @next/next/no-img-element` comments — ESLint flags these as "Definition for rule not found" since the rule ID has no matching plugin registered.

Plus widespread `prettier/prettier` formatting-only diffs (line-wrap violations) throughout the codebase — looks like prettier was never run project-wide, or a config change shifted its output.

**How to apply:** Before treating `npm run lint` failures as something you introduced, run `npx eslint <your files>` before and after your change (or `git stash`) to isolate what's actually new vs. pre-existing baseline noise. Don't attempt to fix the whole repo's lint debt as a side effect of an unrelated task — it's out of scope unless the user asks for a lint cleanup specifically. See [[feedback-verify-in-browser-not-guess]] for the related principle of not touching more than what's asked.

This is a repo-wide issue, not scoped to any one slice — worth flagging to the user/api-developer/code-reviewer if it comes up again, since it may eventually need a dedicated cleanup pass (`eslint.config.mjs` plugin registration + a bulk `--fix` + arrow-function conversion pass) that should be its own deliberate task, not smuggled into a bug fix.
