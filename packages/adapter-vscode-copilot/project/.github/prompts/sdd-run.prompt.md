---
name: sdd-run
description: Execute the full SDD pipeline (SDD: run)
agent: agent
---
Run **SDD: run** — full Spec-Driven Development pipeline for this project.

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

## Human vs agent ownership

### Human-owned (edit freely)

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them

### Agent-owned / regenerable (do not ask the human to edit)

- `tests/features/**` — Cucumber `.feature`
- `tests/steps/**` — step definitions
- `tests/e2e/**` — Playwright specs
- `.sdd/canonical/**` — normalized scenarios
- `.sdd/plan/**` — SDD task plan
- `.sdd/runs/**` — run reports
- `.sdd/ticket.json` — provenance from from-ticket bootstrap
- `src/**` under the SDD implement phase (agent implements to make tests pass)

### Agent must not

- Edit `specs/` without an explicit human request — **except** writing a draft via from-ticket bootstrap
- Invent business rules or acceptance criteria missing from the ticket/specs — stop and ask for a specs change
- Suggest that the human manually fix generated features/steps/e2e to green the suite
- Put ticketing secrets on argv or in the repo; use env vars only

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit features, steps, e2e, or production code for the happy path.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags: `@api` → Cucumber; `@ui`/`@e2e` → Playwright.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status) — not file watch.
