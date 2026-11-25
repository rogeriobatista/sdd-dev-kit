---
name: sdd-run
description: Execute the full SDD pipeline (SDD: run)
agent: agent
---
Run **SDD: run** — full Spec-Driven Development pipeline for this project.

## Pipeline phases (run)

Execute the full pipeline. Cap diagnose→implement at `loop.maxDiagnoseIterations` (default 3).

**Before normalize/executable:** run **stack detection** (`detectStack` on premises + specs). If missing/ambiguous, **STOP** and ask the human to declare stack in `.sdd/premises.md`. After a clear result, update `.sdd/stack.json` and align `sdd.yaml` `adapter` when safe. Prefer the detected stack over a stale hard-coded yaml-only choice; if falling back to `sdd.yaml`, warn in status.

### 1. normalize

- Read all `specs/*.md` (ignore `_example.md` unless it is the only content and user intends to use it).
- Read `.sdd/premises.md`.
- Produce `.sdd/canonical/*.json` with stable scenario ids, Portuguese steps (`Dado`/`Quando`/`Então`/`E`), and tags.
- **If ambiguous:** stop. Ask the human to clarify in `specs/`. Do **not** invent business rules.

### 2. executable

Materialize from canonical using the stack adapter (regenerate freely; never ask the human to edit these files):

| Adapter | Materialize target |
|---------|-------------------|
| `typescript` / `ts` | `@api` → Cucumber features/steps; `@ui`/`@e2e` → Playwright |
| `python` | pytest stubs under `tests/test_*.py` |
| `react-vite` | `@ui`/`@e2e` → Playwright; `@api` → optional Vitest unit stubs |
| `node-graphql` | `@api` → Cucumber + Vitest GraphQL stubs |
| `terraform` | `tests/*.tftest.hcl` with GWT comments / assert stubs |

### 3. plan

- Write `.sdd/plan/` with small, ordered, testable tasks under premises constraints.

### 4. implement

- Implement production code (and complete step stubs only when needed) so red tests can go green.
- Follow TDD: keep tests as the source of truth; do not weaken assertions to pass.

### 5. verify

- Run commands from `sdd.yaml` `runners` — **keys differ by adapter** (`cucumber`/`playwright`, `pytest`, `vitest`, `fmt`/`validate`/`terraform`, or `all`).
- Terraform verify must **not** require cloud credentials (fmt / validate / `terraform test` only — no apply).
- Persist structured results under `.sdd/runs/<id>/`.

### 6. diagnose (on failure)

- Fix implementation against failing tests only.
- If the **spec** is wrong, stop and ask the human to edit `specs/` — do not silently change specs.
- Loop back to implement until green or iteration cap.

### 7. report

- Summarize pass/fail, remaining failures, and paths to reports.
- Optionally remind the human they can run **demo** to build a stakeholder pack from this verify evidence.

## Verify (tests only)

Run `runners.all` (or the stack-specific runner the user names). Do not normalize or implement.

## Demo (after verify)

Build a PO/BO/QA demo pack from the latest (or named) run evidence via `@rogeriobatista/core` `buildDemo({ projectRoot, runId?, evidenceKey? })` → `.sdd/evidence/<key>/latest/demo/` (`index.html`, `SUMMARY.md`, `manifest.json`). Key comes from ticket / `evidence.key` / stable local id. Full procedure is in the **Demo** section. Not part of the automatic run loop; invoke explicitly (`demo` / `/sdd demo` / `SDD: demo`). After verify, prefer calling `updateEvidencePack` so `latest/raw` stays current even before demo.

## Status

Read the latest `.sdd/runs/*` (and plan/canonical/ticket/evidence/demo presence). Report phase statuses, last exit codes, **adapter id + detection source** (premises / specs / stack.json / sdd.yaml fallback), any stack warnings, resolved `evidenceKey`, and whether `.sdd/ticket.json` / `.sdd/stack.json` / `.sdd/evidence/` exist.

## Human vs agent ownership

### Human-owned (edit freely)

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them

### Agent-owned / regenerable (do not ask the human to edit)

- Generated tests for the active stack (`tests/features/**`, `tests/steps/**`, `tests/e2e/**`, `tests/test_*.py`, `tests/*.tftest.hcl`, `tests/unit/**`, …)
- `.sdd/canonical/**` — normalized scenarios
- `.sdd/plan/**` — SDD task plan
- `.sdd/runs/**` — run reports (internal; linked from evidence meta)
- `.sdd/evidence/**` — stakeholder evidence packs keyed by ticket / stable id (`latest/demo/` is the PO/BO/QA path)
- `.sdd/evidence-id.json` — stable local evidence id when no ticket
- `.sdd/demo/**` — legacy per-run demo copies (prefer `.sdd/evidence/<key>/latest/demo/`)
- `.sdd/ticket.json` — provenance from from-ticket bootstrap (includes `evidenceKey` / `evidencePath`)
- `.sdd/stack.json` — stack detection provenance (agent-owned; human declares stack in premises/specs)
- Production code under the SDD implement phase (agent implements to make tests pass)

### Agent must not

- Edit `specs/` without an explicit human request — **except** writing a draft via from-ticket bootstrap
- Invent business rules or acceptance criteria missing from the ticket/specs — stop and ask for a specs change
- Suggest that the human manually fix generated features/steps/e2e to green the suite
- Put ticketing secrets on argv or in the repo; use env vars only

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit generated tests, plan, canonical, or production code for the happy path.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags (default TS/UI stacks): `@api` → API/Cucumber/pytest track; `@ui`/`@e2e` → Playwright when the adapter supports UI.
- Stack adapters are first-class: `typescript` | `python` | `react-vite` | `node-graphql` | `terraform` (alias `ts` → `typescript`).
- **Stack comes from specification docs** (premises → specs → optional stack.json / sdd.yaml fallback). If missing/ambiguous: stop and ask the human — never invent a stack from app source as the primary signal.
- Terraform verify: no cloud apply / no secrets required for default runners.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status / demo) — not file watch.
- Evidence packs (`.sdd/evidence/<key>/latest/demo/`) are for PO/BO/QA: Portuguese business language from specs, no code dumps, no secrets, offline-relative paths. Same key updates in place as development progresses.
