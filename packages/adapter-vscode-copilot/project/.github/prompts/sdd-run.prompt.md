---
name: sdd-run
description: Execute the full SDD pipeline (SDD: run)
agent: agent
---
Run **SDD: run** — full Spec-Driven Development pipeline for this project.

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
  → (optional) docs
```

Cap diagnose→implement at `loop.maxDiagnoseIterations` (default 3). Do **not** stop mid-loop to ask the human to fix code. If failures look like **wrong/ambiguous specs**, exit the loop and ask the human to iterate on `specs/` (the only human gate).

**Optional docs (after evidence):** `docs` / `/sdd docs` / `SDD: docs` builds `docs/sdd/` (PRODUCT, TECHNICAL, CHANGELOG, HANDOFF, ADR, API) from specs + Dev Spec + design + research + evidence (+ bugs when present). Must not invent features absent from specs — mark gaps. Subcommands: `changelog`, `api`, `handoff`. Full procedure: **Docs**.

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

## Research (best practices)

Consult **market / standards best practices** for the detected stack whenever there is doubt during the pipeline (**canonical step 11 — continuous policy**, not a separate stop). Do **not** invent “best practice” claims without a catalog/source citation or an explicit `.sdd/premises.md` override.

### When to run

| Trigger | Behavior |
|---------|----------|
| `/sdd run` / `SDD: run` | **Continuous** during steps 2–10 (especially before/while writing Dev Spec, Implementation Plan, Design Approach, tests, and implement). Refresh the research pack when sources change or doubt arises |
| `/sdd research` / `SDD: research` | **Optional standalone** — refresh research pack without running the full pipeline |
| `dev-spec` / `implementation-plan` / `design-approach` / `implement` | Must open research output (or run research first if missing) |

### Steps

1. **Confirm stack** via stack detection (premises → specs → stack.json / sdd.yaml). If missing/ambiguous, STOP — do not research against an invented stack.
2. **Resolve evidence key** with `@rogeriobatista/core` `resolveEvidenceKey(projectRoot)` (ticket / `evidence.key` / stable local id). Encode path segments the same way as evidence packs (`:` → `_`).
3. **Open the catalog** for this kit:
   - `packages/adapter-shared/content/best-practices-catalog.md` (and/or `.json`)
   - In an installed project, prefer the copy shipped with the host adapter / skill path, or the workspace kit path when developing the kit itself.
4. **Select domains:** stack-mapped section(s) **plus Security (always)**.
5. **Consult sources:** Prefer MCP **WebSearch** / fetch of the official catalog URLs when available. Otherwise use the curated catalog URLs and short guidance as-is. Do **not** scrape paywalled or copyrighted full documents into the repo.
6. **Write agent-owned outputs** under `.sdd/research/<encodedEvidenceKey>/`:
   - `BEST_PRACTICES.md` — stakeholder-friendly summary (Portuguese OK) of practices **applied** to this work, conflicts with premises, and source citations
   - `sources.json` — machine list of `{ id, url, title, domain, applied: true|false, note? }` plus `catalogVersion`, `stack`, `evidenceKey`, `researchedAt`
7. **Cite in docs/tasks:** every Dev Spec / Implementation Plan / Design Approach item that relies on a practice must reference a source `id` or URL from `sources.json` / the catalog. Premises overrides must be noted as such.
8. **Conflicts:** if a catalog practice conflicts with `.sdd/premises.md`, **premises win**. Record the conflict in `BEST_PRACTICES.md` (do not silently ignore premises).

### Output layout

```
.sdd/research/<encodedEvidenceKey>/
  BEST_PRACTICES.md
  sources.json
```

Example key `linear:ENG-42` → `.sdd/research/linear_ENG-42/`.

### `sources.json` shape (minimum)

```json
{
  "catalogVersion": 1,
  "stack": "react-vite",
  "evidenceKey": "linear:ENG-42",
  "researchedAt": "2026-11-25T22:00:00.000Z",
  "sources": [
    {
      "id": "fe-playwright",
      "url": "https://playwright.dev/docs/best-practices",
      "title": "Playwright best practices",
      "domain": "frontend",
      "applied": true,
      "note": "Role/label locators for checkout CTA"
    }
  ],
  "premisesConflicts": []
}
```

### Hard rules for research

- Links + short applied guidance only — **no** pasting substantial copyrighted doc text into the repo.
- No secrets in research output.
- Quality over quantity: stick to the curated catalog; add an extra official URL only when the catalog lacks a needed topic, and still record it in `sources.json`.
- Inventing uncited practices is forbidden.

## Human vs agent ownership

### Human-owned (edit freely) — **only human iteration surface**

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E); create/adjust acceptance here (canonical **step 1**)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them
- `.sdd/bugs/<id>/REPORT.md` — client bug report (passos, esperado/atual, severidade, ambiente); refine like specs
- Optional: review that generated Spec Tests match intent — if not, fix `specs/` and re-run materialize; do **not** hand-edit generated tests to green

### Agent-owned / regenerable (do not ask the human to edit)

- Executable Spec Tests (`tests/features/**`, `tests/spec/**`, `tests/steps/**`, `tests/test_*.py`, `tests/*.tftest.hcl`, …) — **step 2**
- `.sdd/dev-spec.md` — Dev Spec — **step 3**
- `.sdd/implementation-plan.md` — Dev Implementation Plan — **step 4** (legacy `.sdd/plan/**` optional)
- `.sdd/design-approach.md` — Design & Approach — **step 5**
- `tests/unit/**` — unit tests — **step 6**
- `tests/integration/**` — integration tests — **step 7**
- `tests/e2e/**` — e2e tests — **step 8**
- Regression tests created by `/sdd reproduce` under `tests/`
- `.sdd/canonical/**` — normalized scenarios (supports step 2)
- `.sdd/research/**` — best-practices research packs (`BEST_PRACTICES.md`, `sources.json`) — **step 11 support**
- `.sdd/runs/**` — run reports (internal; linked from evidence meta)
- `.sdd/evidence/**` — stakeholder evidence packs keyed by ticket / stable id (`latest/demo/` is the PO/BO/QA path) — **step 10**
- `.sdd/evidence-id.json` — stable local evidence id when no ticket
- `.sdd/demo/**` — legacy per-run demo copies (prefer `.sdd/evidence/<key>/latest/demo/`)
- `.sdd/bugs/<id>/{DEBUG,QA}.md` + `meta.json` — debug log, QA sign-off, bug provenance
- `docs/sdd/**` — professional documentation pack (PRODUCT / TECHNICAL / CHANGELOG / HANDOFF / ADR / API) — optional after evidence; `/sdd docs`
- `.sdd/ticket.json` — provenance from from-ticket bootstrap (includes `evidenceKey` / `evidencePath`)
- `.sdd/stack.json` — stack detection provenance (agent-owned; human declares stack in premises/specs)
- Production code under the SDD implement loop (**step 9**) and `/sdd fix`

### Agent must not

- Edit `specs/` without an explicit human request — **except** writing a draft via from-ticket bootstrap
- Invent business rules or acceptance criteria missing from the ticket/specs — stop and ask for a specs change
- Invent bug reproduction steps missing from the client `REPORT.md`
- Invent product features or acceptance criteria in `docs/sdd/**` that are missing from `specs/` / premises
- Suggest that the human manually fix generated Spec/unit/integration/e2e tests or production code to green the suite
- Stop the `/sdd run` auto-loop mid-way to ask the human to fix implementation — keep diagnose→implement→verify until all test levels pass or cap; only exit early for **spec** gaps
- Enter `/sdd fix` without a failing regression from `/sdd reproduce` first (TDD for bugs)
- Put ticketing secrets on argv or in the repo; use env vars only

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit generated tests, Dev Spec, implementation plan, design approach, canonical, or production code for the happy path.
- **Human iteration surface (ONLY):** `specs/` (+ clarifying acceptance; optional review that Spec Tests match intent). Steps 2–10 of `/sdd run` are an **automated loop** until all test levels pass or the diagnose cap — do **not** stop mid-loop to ask the human to fix code.
- If failures look like **wrong/ambiguous specs**, exit the auto-loop and ask the human to iterate on `specs/` — the only human gate.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags (default TS/UI stacks): `@api` → API/Cucumber/pytest Spec track; `@ui`/`@e2e` → Playwright when the adapter supports UI.
- Stack adapters are first-class: `typescript` | `python` | `react-vite` | `node-graphql` | `terraform` (alias `ts` → `typescript`).
- **Stack comes from specification docs** (premises → specs → optional stack.json / sdd.yaml fallback). If missing/ambiguous: stop and ask the human — never invent a stack from app source as the primary signal.
- Terraform verify: no cloud apply / no secrets required for default runners.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status / demo / docs / bug-report / reproduce / debug / qa / fix) — not file watch.
- Canonical artifacts: Spec Tests under `tests/features` or `tests/spec`; Dev Spec / Implementation Plan / Design Approach under `.sdd/dev-spec.md`, `.sdd/implementation-plan.md`, `.sdd/design-approach.md`; test layers `tests/unit/`, `tests/integration/`, `tests/e2e/`; evidence under `.sdd/evidence/<key>/latest/`; docs under `docs/sdd/`; client bugs under `.sdd/bugs/<id>/`.
- Evidence packs (`.sdd/evidence/<key>/latest/demo/`) are for PO/BO/QA: Portuguese business language from specs, no code dumps, no secrets, offline-relative paths. Same key updates in place as development progresses. Evidence/demo update is step 10 (after green or after the auto-loop ends with a report). After `/sdd fix`, refresh the pack for that bug/ticket evidence key.
- **Docs (optional after evidence):** `docs` / `/sdd docs` generates `docs/sdd/` from specs + Dev Spec + design + research + evidence (+ bugs when present). Must **not** invent features absent from specs/premises; mark gaps instead. Subcommands: `changelog`, `api`, `handoff`.
- **Bugfix TDD:** never “fix” client bugs without a failing regression from `/sdd reproduce` first. Human refines `REPORT.md`; agent owns DEBUG/QA/meta, regression tests, and code.
- **Research / best practices (step 11 — continuous):** during steps 2–10 (and during `/sdd debug` when uncertain), open the curated catalog (`best-practices-catalog`) for the detected stack **plus security** whenever there is doubt. Cite sources in Dev Spec / Implementation Plan / Design Approach / DEBUG; do not invent uncited practices. Premises override catalog on conflict (note it). Links + short guidance only — no scraping copyrighted full docs into the repo.
