## Pipeline phases (run)

Execute the full pipeline. Cap diagnose→implement at `loop.maxDiagnoseIterations` (default 3).

### 1. normalize

- Read all `specs/*.md` (ignore `_example.md` unless it is the only content and user intends to use it).
- Read `.sdd/premises.md`.
- Produce `.sdd/canonical/*.json` with stable scenario ids, Portuguese steps (`Dado`/`Quando`/`Então`/`E`), and tags.
- **If ambiguous:** stop. Ask the human to clarify in `specs/`. Do **not** invent business rules.

### 2. executable

- Materialize Cucumber + Playwright from canonical:
  - `@api` (and untagged) → `tests/features/*.feature` + `tests/steps/*`
  - `@ui` / `@e2e` → `tests/e2e/*.spec.ts` (and Cucumber too only if premises require)
- Regenerate freely; never ask the human to edit these files.

### 3. plan

- Write `.sdd/plan/` with small, ordered, testable tasks under premises constraints.

### 4. implement

- Implement `src/` (and complete step stubs only when needed) so red tests can go green.
- Follow TDD: keep tests as the source of truth; do not weaken assertions to pass.

### 5. verify

- Run commands from `sdd.yaml` `runners` (`cucumber`, `playwright`, or `all`).
- Persist structured results under `.sdd/runs/<id>/`.

### 6. diagnose (on failure)

- Fix implementation against failing tests only.
- If the **spec** is wrong, stop and ask the human to edit `specs/` — do not silently change specs.
- Loop back to implement until green or iteration cap.

### 7. report

- Summarize pass/fail, remaining failures, and paths to reports.

## Verify (tests only)

Run `runners.all` (or cucumber/playwright if the user specifies). Do not normalize or implement.

## Status

Read the latest `.sdd/runs/*` (and plan/canonical/ticket presence). Report phase statuses, last exit codes, and whether `.sdd/ticket.json` exists.
