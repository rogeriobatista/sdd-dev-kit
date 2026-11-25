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

## Research (best practices)

Consult **market / standards best practices** for the detected stack before writing the plan and before implementing. Do **not** invent “best practice” claims without a catalog/source citation or an explicit `.sdd/premises.md` override.

### When to run

| Trigger | Behavior |
|---------|----------|
| `/sdd run` / `SDD: run` | **Required** phase after `executable`, before `plan` (also re-check relevant sources during `implement`) |
| `/sdd research` / `SDD: research` | **Optional standalone** — refresh research pack without running the full pipeline |
| `plan` / `implement` | Must open research output (or run research first if missing) |

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
7. **Cite in plan:** every plan task that relies on a practice must reference a source `id` or URL from `sources.json` / the catalog. Premises overrides must be noted as such.
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

### Human-owned (edit freely)

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them

### Agent-owned / regenerable (do not ask the human to edit)

- Generated tests for the active stack (`tests/features/**`, `tests/steps/**`, `tests/e2e/**`, `tests/test_*.py`, `tests/*.tftest.hcl`, `tests/unit/**`, …)
- `.sdd/canonical/**` — normalized scenarios
- `.sdd/plan/**` — SDD task plan
- `.sdd/research/**` — best-practices research packs (`BEST_PRACTICES.md`, `sources.json`) keyed like evidence
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
- **Research / best practices:** before `plan`/`implement`, open the curated catalog (`best-practices-catalog`) for the detected stack **plus security**. Cite sources in plan tasks; do not invent uncited practices. Premises override catalog on conflict (note it). Links + short guidance only — no scraping copyrighted full docs into the repo.
