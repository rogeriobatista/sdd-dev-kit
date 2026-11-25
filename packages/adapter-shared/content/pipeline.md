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

### 3. research

Consult market / standards best practices for the detected stack **plus security** before planning.

- Open `packages/adapter-shared/content/best-practices-catalog.md` (and/or `.json`) for the stack domains; prefer MCP WebSearch / fetch of catalog URLs when available.
- Write `.sdd/research/<encodedEvidenceKey>/BEST_PRACTICES.md` + `sources.json` (urls, what was applied, premises conflicts).
- **Must cite sources** in subsequent plan tasks; do not invent “best practice” without a catalog source or premises override.
- Premises win on conflict — note the conflict in `BEST_PRACTICES.md`.
- Full procedure: **Research (best practices)** section. Optional standalone: `research` / `/sdd research` / `SDD: research`.

### 4. plan

- Write `.sdd/plan/` with small, ordered, testable tasks under premises constraints.
- Each task that applies a market practice **must cite** a research/`sources.json` id or URL (or an explicit premises override).

### 5. implement

- Implement production code (and complete step stubs only when needed) so red tests can go green.
- Follow TDD: keep tests as the source of truth; do not weaken assertions to pass.
- Follow `.sdd/research/.../BEST_PRACTICES.md` (and re-open catalog/security sources as needed). Premises still win on conflict.

### 6. verify

- Run commands from `sdd.yaml` `runners` — **keys differ by adapter** (`cucumber`/`playwright`, `pytest`, `vitest`, `fmt`/`validate`/`terraform`, or `all`).
- Terraform verify must **not** require cloud credentials (fmt / validate / `terraform test` only — no apply).
- Persist structured results under `.sdd/runs/<id>/`.

### 7. diagnose (on failure)

- Fix implementation against failing tests only.
- If the **spec** is wrong, stop and ask the human to edit `specs/` — do not silently change specs.
- Loop back to implement until green or iteration cap.

### 8. report

- Summarize pass/fail, remaining failures, and paths to reports.
- Optionally remind the human they can run **demo** to build a stakeholder pack from this verify evidence.

## Verify (tests only)

Run `runners.all` (or the stack-specific runner the user names). Do not normalize or implement.

## Demo (after verify)

Build a PO/BO/QA demo pack from the latest (or named) run evidence via `@rogeriobatista/core` `buildDemo({ projectRoot, runId?, evidenceKey? })` → `.sdd/evidence/<key>/latest/demo/` (`index.html`, `SUMMARY.md`, `manifest.json`). Key comes from ticket / `evidence.key` / stable local id. Full procedure is in the **Demo** section. Not part of the automatic run loop; invoke explicitly (`demo` / `/sdd demo` / `SDD: demo`). After verify, prefer calling `updateEvidencePack` so `latest/raw` stays current even before demo.

## Status

Read the latest `.sdd/runs/*` (and plan/canonical/ticket/evidence/demo/research presence). Report phase statuses, last exit codes, **adapter id + detection source** (premises / specs / stack.json / sdd.yaml fallback), any stack warnings, resolved `evidenceKey`, whether `.sdd/ticket.json` / `.sdd/stack.json` / `.sdd/evidence/` / `.sdd/research/` exist, and research catalog citations when present.
