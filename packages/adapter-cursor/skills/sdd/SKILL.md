---
name: sdd
description: >-
  Spec-Driven Development Protocol Kit. Use when the user invokes /sdd, asks to
  init SDD, run the SDD pipeline from natural-language specs, import a Linear or
  Jira ticket into specs, verify Cucumber/ Playwright, or check SDD status.
  Subcommands: init | from-ticket | run | verify | status.
---

# /sdd — Spec-Driven Development

Protocol Kit orchestration for Cursor. The human edits **only** `specs/*.md` (prosa + Dado/Quando/Então) and optionally `.sdd/premises.md`. Everything else is generated or agent-owned.

Ticket import (`/sdd from-ticket`) is a **bootstrap**: it drafts `specs/` from Linear or Jira. After import, the human may still edit `specs/` (still the only human surface) before `/sdd run`.

## Subcommands

### `/sdd init`

Scaffold the current project for SDD:

1. Ensure folders: `specs/`, `.sdd/` (premises, canonical, plan, runs), `tests/features`, `tests/steps`, `tests/e2e`, `src/`.
2. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`, adapter `typescript`). Optionally include a commented `ticketing:` section for Linear/Jira.
3. Write `.sdd/premises.md` and `specs/_example.md` from adapter-cursor templates if missing.
4. Add Cucumber + Playwright configs and npm scripts via `@sdd-dev-kit/adapter-ts` scaffold (or copy equivalent files from the kit example).
5. Do **not** overwrite existing human specs.

Report the tree and tell the user: edit `specs/`, or `/sdd from-ticket <id>`, then `/sdd run`.

### `/sdd from-ticket <id>`

Bootstrap NL specs from a **Linear** or **Jira** ticket, then optionally continue with the full pipeline.

**Usage**

- `/sdd from-ticket ENG-123` — auto-detect when possible; for ambiguous `KEY-123` use `sdd.yaml` `ticketing.defaultProvider` or a prefix
- `/sdd from-ticket linear:ENG-123` or `/sdd from-ticket jira:SHOP-7`
- `/sdd from-ticket ENG-123 --run` — after writing the draft, continue with `/sdd run`

**Steps**

1. Read `sdd.yaml` `ticketing` (provider configs = **env var names only**, never secrets on argv).
2. Resolve provider:
   - UUID → Linear
   - `linear:` / `jira:` prefix → that provider
   - Ambiguous `KEY-123` → `ticketing.defaultProvider`, else ask the human
3. Fetch via `@sdd-dev-kit/core` (`fromTicket` / `LinearProvider` / `JiraProvider`):
   - Linear: `LINEAR_API_KEY` (GraphQL)
   - Jira: `JIRA_BASE_URL` + `JIRA_API_TOKEN` (+ `JIRA_EMAIL` for Cloud basic auth; Bearer if email unset)
4. Map title/description/acceptance criteria/labels → Portuguese NL draft (`## Intenção` + `## Cenários` with `Dado`/`Quando`/`Então`).
5. Write `specs/<id>-<slug>.md` and provenance `.sdd/ticket.json`.
6. **Default:** stop and ask the human to review/edit `specs/` (enrich weak AC). **With `--run`:** continue into `/sdd run`.

**Hard rules for from-ticket**

- Do **not** invent acceptance criteria or business rules that are not in the ticket.
- If the ticket lacks testable scenarios, ask the human to enrich `specs/` before run — do not fabricate GWT.
- Never print API tokens or put secrets on the command line; use environment variables only.
- Prefer the core helpers (`fromTicket`, providers) over ad-hoc HTTP when available in the workspace.

### `/sdd run`

Execute the full pipeline. Cap diagnose→implement at `loop.maxDiagnoseIterations` (default 3).

#### 1. normalize

- Read all `specs/*.md` (ignore `_example.md` unless it is the only content and user intends to use it).
- Read `.sdd/premises.md`.
- Produce `.sdd/canonical/*.json` with stable scenario ids, Portuguese steps (`Dado`/`Quando`/`Então`/`E`), and tags.
- **If ambiguous:** stop. Ask the human to clarify in `specs/`. Do **not** invent business rules.

#### 2. executable

- Materialize Cucumber + Playwright from canonical:
  - `@api` (and untagged) → `tests/features/*.feature` + `tests/steps/*`
  - `@ui` / `@e2e` → `tests/e2e/*.spec.ts` (and Cucumber too only if premises require)
- Regenerate freely; never ask the human to edit these files.

#### 3. plan

- Write `.sdd/plan/` with small, ordered, testable tasks under premises constraints.

#### 4. implement

- Implement `src/` (and complete step stubs only when needed) so red tests can go green.
- Follow TDD: keep tests as the source of truth; do not weaken assertions to pass.

#### 5. verify

- Run commands from `sdd.yaml` `runners` (`cucumber`, `playwright`, or `all`).
- Persist structured results under `.sdd/runs/<id>/`.

#### 6. diagnose (on failure)

- Fix implementation against failing tests only.
- If the **spec** is wrong, stop and ask the human to edit `specs/` — do not silently change specs.
- Loop back to implement until green or iteration cap.

#### 7. report

- Summarize pass/fail, remaining failures, and paths to reports.

### `/sdd verify`

Run `runners.all` (or cucumber/playwright if the user specifies). Do not normalize or implement.

### `/sdd status`

Read the latest `.sdd/runs/*` (and plan/canonical/ticket presence). Report phase statuses, last exit codes, and whether `.sdd/ticket.json` exists.

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** `/sdd from-ticket` may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit features, steps, e2e, or production code for the happy path.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags: `@api` → Cucumber; `@ui`/`@e2e` → Playwright.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).

## Template locations in this kit

- `packages/adapter-cursor/templates/sdd.yaml`
- `packages/adapter-cursor/templates/specs/_example.md`
- `packages/adapter-cursor/templates/.sdd/premises.md`
- Reference example: `examples/coupon-checkout/`
- Offline ticket fixture: `packages/core/src/ticketing/fixtures/`
