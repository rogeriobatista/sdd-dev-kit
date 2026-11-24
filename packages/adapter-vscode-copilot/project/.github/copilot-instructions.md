# SDD Protocol Kit (GitHub Copilot)

This repository uses Spec-Driven Development. Humans edit **only** `specs/*.md` (+ `.sdd/premises.md` when changing project rules). Copilot runs the SDD pipeline; do not ask the human to hand-edit generated features, steps, e2e, canonical, or plan.

## Chat intents (= `/sdd` elsewhere)

| Say in Copilot Chat | Meaning |
|---------------------|---------|
| `SDD: init` | Scaffold project + install Copilot instruction/prompt files |
| `SDD: from-ticket <id>` | Bootstrap specs from Linear/Jira |
| `SDD: run` | Full pipeline |
| `SDD: verify` | Run test runners only |
| `SDD: status` | Summarize `.sdd/runs` |

Optional slash prompts (when prompt files are installed under `.github/prompts/`): `/sdd-init`, `/sdd-from-ticket`, `/sdd-run`, `/sdd-verify`, `/sdd-status`.

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

## Init — scaffold the project for SDD

1. Ensure folders: `specs/`, `.sdd/` (premises, canonical, plan, runs), `tests/features`, `tests/steps`, `tests/e2e`, `src/`.
2. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`, adapter `typescript`). Optionally include a commented `ticketing:` section for Linear/Jira.
3. Write `.sdd/premises.md` and `specs/_example.md` from shared templates if missing.
4. Add Cucumber + Playwright configs and npm scripts via `@sdd-dev-kit/adapter-ts` scaffold (or copy equivalent files from the kit example).
5. Install the **host adapter** instruction files for this project (Cursor skill/rules, Claude `CLAUDE.md` + `.claude/skills`, or Copilot `.github/copilot-instructions.md` + prompts) — do not overwrite existing human specs.
6. Do **not** overwrite existing human specs.

Report the tree and tell the user: edit `specs/`, or run from-ticket, then run the full pipeline.

## From-ticket — bootstrap NL specs from Linear or Jira

Bootstrap NL specs from a **Linear** or **Jira** ticket, then optionally continue with the full pipeline.

### Usage (host-agnostic intents)

- `from-ticket ENG-123` — auto-detect when possible; for ambiguous `KEY-123` use `sdd.yaml` `ticketing.defaultProvider` or a prefix
- `from-ticket linear:ENG-123` or `from-ticket jira:SHOP-7`
- `from-ticket ENG-123 --run` — after writing the draft, continue with the full pipeline run

### Steps

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
6. **Default:** stop and ask the human to review/edit `specs/` (enrich weak AC). **With `--run`:** continue into the full pipeline.

### Hard rules for from-ticket

- Do **not** invent acceptance criteria or business rules that are not in the ticket.
- If the ticket lacks testable scenarios, ask the human to enrich `specs/` before run — do not fabricate GWT.
- Never print API tokens or put secrets on the command line; use environment variables only.
- Prefer the core helpers (`fromTicket`, providers) over ad-hoc HTTP when available in the workspace.

### Ticketing access by host

- **Cursor / Claude:** prefer MCP Linear/Jira tools when configured; otherwise use core REST/GraphQL providers with env vars.
- **GitHub Copilot (VS Code):** MCP may be unavailable or limited — use `@sdd-dev-kit/core` providers / REST with env vars (`LINEAR_API_KEY`, `JIRA_*`). Document env setup; never put secrets in chat or repo files.

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

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit features, steps, e2e, or production code for the happy path.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags: `@api` → Cucumber; `@ui`/`@e2e` → Playwright.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status) — not file watch.

## Ticketing note (Copilot gap)

- Cursor and Claude often use **MCP** for Linear/Jira.
- Copilot in VS Code may **not** expose the same MCP tools — use `@sdd-dev-kit/core` REST/GraphQL providers with environment variables (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`).
- Never paste API tokens into chat or commit them.

## Template locations in this kit

- Shared source: `packages/adapter-shared/content/` (pipeline, from-ticket, human boundary, hard rules)
- Shared scaffold: `packages/adapter-shared/templates/` (`sdd.yaml`, `specs/_example.md`, `.sdd/premises.md`)
- Reference example: `examples/coupon-checkout/`
- Offline ticket fixture: `packages/core/src/ticketing/fixtures/`

