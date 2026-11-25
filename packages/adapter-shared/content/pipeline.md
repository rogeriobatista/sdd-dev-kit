## Pipeline phases (run) — canonical 11-step flow

**Lock this order.** Step 1 is the only human iteration gate. Steps 2–10 run automatically in `/sdd run` / `SDD: run` after specs are accepted. Step 11 is continuous policy (not a separate stop).

| Step | Actor | Action | Artifact |
|------|-------|--------|----------|
| 1 | **Human** | Natural language mixed with BDD (Cucumber-style) | `specs/` |
| 2 | Kit | Create **executable Spec Tests** validating the described rules | `tests/spec/` or `tests/features/` (per stack / `sdd.yaml`) |
| 3 | Kit | Create **Dev Spec** document for the implementation | `.sdd/dev-spec.md` |
| 4 | Kit | Create **Dev Implementation Plan** document | `.sdd/implementation-plan.md` |
| 5 | Kit | Create **Design & Approach** definitions | `.sdd/design-approach.md` |
| 6 | Kit | Create **unit tests** | `tests/unit/` |
| 7 | Kit | Create **integration tests** | `tests/integration/` |
| 8 | Kit | Create **e2e tests** | `tests/e2e/` |
| 9 | Kit | Develop in a loop until **all test levels** pass (spec + unit + integration + e2e) | `src/` + `.sdd/runs/` |
| 10 | Kit | Create **evidence** proving the ask was met | `.sdd/evidence/<key>/latest/` |
| 11 | Kit | **During all steps:** any doubt → market best practices | `.sdd/research/<key>/` |

**Human iteration surface (ONLY):** creating/adjusting NL specs in `specs/` (and clarifying acceptance). Optional review that generated Spec Tests match intent — if they do not, fix `specs/` and re-materialize; **never** hand-patch generated tests or production code to green the suite.

**Automated loop (no human mid-loop):** after specs are accepted/written, `/sdd run` / `SDD: run` runs steps 2→10:

```text
detect stack → spec-tests → dev-spec → implementation-plan → design-approach
  → unit-tests → integration-tests → e2e-tests
  → implement → verify (all layers) ⇄ diagnose*
  → evidence
```

Cap diagnose→implement at `loop.maxDiagnoseIterations` (default 3). Do **not** stop mid-loop to ask the human to fix code. If failures look like **wrong/ambiguous specs**, exit the loop and ask the human to iterate on `specs/` (the only human gate).

**Before step 2:** run **stack detection** (`detectStack` on premises + specs). If missing/ambiguous, **STOP** and ask the human to declare stack in `.sdd/premises.md`. After a clear result, update `.sdd/stack.json` and align `sdd.yaml` `adapter` when safe. Prefer the detected stack over a stale hard-coded yaml-only choice; if falling back to `sdd.yaml`, warn in status.

**Step 11 (continuous):** open the best-practices catalog + write/update `.sdd/research/<key>/` whenever there is doubt during steps 2–10. Premises win on conflict. Full procedure: **Research (best practices)**. Optional standalone: `research` / `/sdd research` / `SDD: research`.

### 2. spec-tests

Normalize `specs/` into `.sdd/canonical/*.json` (stable ids, Portuguese `Dado`/`Quando`/`Então`/`E`, tags), then materialize **executable Spec Tests** with the stack adapter (regenerate freely; never ask the human to edit these files to green the suite):

| Adapter | Spec Tests target |
|---------|-------------------|
| `typescript` / `ts` | `@api` → Cucumber under `tests/features` (or `tests/spec` if configured); `@ui`/`@e2e` also inform step 8 |
| `python` | pytest stubs under `tests/` / Spec layer as configured |
| `react-vite` | Spec/API stubs as tagged; UI primarily step 8 Playwright |
| `node-graphql` | `@api` → Cucumber + Vitest GraphQL stubs |
| `terraform` | `tests/*.tftest.hcl` with GWT comments / assert stubs |

**If ambiguous:** stop the auto-loop. Ask the human to clarify in `specs/`. Do **not** invent business rules.

### 3. dev-spec

Write `.sdd/dev-spec.md` — technical Dev Spec derived from accepted `specs/` + premises (scope, interfaces, constraints). Agent-owned; regenerate freely. Cite research sources when applying market practices.

### 4. implementation-plan

Write `.sdd/implementation-plan.md` — ordered, testable implementation tasks under premises constraints. Each task that applies a market practice **must cite** a research/`sources.json` id or URL (or an explicit premises override). Legacy `.sdd/plan/` may mirror tasks; the stable artifact name is `implementation-plan.md`.

### 5. design-approach

Write `.sdd/design-approach.md` — Design & Approach definitions (architecture choices, patterns, trade-offs) for the implementation. Premises win on conflict with catalog practices.

### 6. unit-tests

Create/update **unit tests** under `tests/unit/` (or the path in `sdd.yaml` `paths.unit`). Do not ask the human to edit these to green the suite.

### 7. integration-tests

Create/update **integration tests** under `tests/integration/` (or `paths.integration`).

### 8. e2e-tests

Create/update **e2e tests** under `tests/e2e/` (Playwright etc. when the adapter supports UI). Terraform / headless stacks may use stack-appropriate e2e equivalents or skip when not applicable — note it in the run report.

### 9. implement → verify → diagnose (loop)

- **implement:** production code (and complete step stubs only when needed) so red tests can go green. Follow TDD; do not weaken assertions. Follow research + premises.
- **verify:** run commands from `sdd.yaml` `runners` covering **all test levels** when present: `spec` (or `cucumber`), `unit`, `integration`, `e2e` (or `playwright`), or `runners.all`. Keys differ by adapter (`pytest`, `vitest`, `fmt`/`validate`/`terraform`, …). Terraform verify must **not** require cloud credentials (fmt / validate / `terraform test` only — no apply). Persist structured results under `.sdd/runs/<id>/`.
- **diagnose (on failure):** fix **implementation** against failing tests only; loop back to implement → verify. **Do not** ask the human to fix code mid-loop. If the **spec** is wrong/ambiguous, **exit the loop** and ask the human to edit `specs/`. Continue until green or `loop.maxDiagnoseIterations` (default 3).

### 10. evidence

- Summarize pass/fail, remaining failures, and paths to reports under `.sdd/runs/`.
- Update the stakeholder evidence pack via `updateEvidencePack` / `buildDemo` → `.sdd/evidence/<key>/latest/` (demo under `latest/demo/`).
- **Cap exceeded:** write the run report. If failures look like requirement gaps, point the human back to `specs/`. Otherwise report remaining test failures for the next auto-loop after any needed spec fix.

## Verify (tests only)

Run `runners.all` (or named layer keys: `spec`, `unit`, `integration`, `e2e`, or stack-specific names). Do not rewrite specs or implement.

## Demo (after evidence)

Build a PO/BO/QA demo pack from the latest (or named) run evidence via `@rogeriobatista/core` `buildDemo({ projectRoot, runId?, evidenceKey? })` → `.sdd/evidence/<key>/latest/demo/` (`index.html`, `SUMMARY.md`, `manifest.json`). Key comes from ticket / `evidence.key` / stable local id. Full procedure is in the **Demo** section. Runs as part of / after step 10 — not mid-loop for steps 2–8; invoke explicitly (`demo` / `/sdd demo` / `SDD: demo`) when refreshing the pack. After verify, prefer calling `updateEvidencePack` so `latest/raw` stays current even before demo.

## Status

Read the latest `.sdd/runs/*` and presence of `dev-spec.md` / `implementation-plan.md` / `design-approach.md` / canonical / ticket / evidence / research / test layers. Report phase statuses (steps 1–11), last exit codes, **adapter id + detection source**, any stack warnings, resolved `evidenceKey`, and research catalog citations when present.
