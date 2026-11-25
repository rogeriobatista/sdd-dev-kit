---
name: sdd
description: >-
  Spec-Driven Development Protocol Kit. Use when the user asks for SDD init,
  from-ticket, run, research, verify, demo, or status — including natural-language
  intents like "SDD: run" or "import ticket ENG-42 into specs".
---

# SDD — Spec-Driven Development (Claude)

Protocol Kit orchestration for **Claude Code / Claude in VS Code**. Same contract as Cursor and Copilot: human iterates only on `specs/`; after specs are accepted, `SDD: run` is an automated loop until spec tests pass (no mid-loop human code fixes).

## Claude command map (natural-language intents)

| Intent | Say / invoke |
|--------|----------------|
| Init | `SDD: init` or "scaffold this project for SDD" |
| From ticket | `SDD: from-ticket ENG-42` / `linear:ENG-42` / `jira:SHOP-7` (optional `--run`) |
| Run pipeline | `SDD: run` |
| Research (best practices) | `SDD: research` (also inside `SDD: run` before plan) |
| Verify only | `SDD: verify` |
| Demo (PO/BO/QA) | `SDD: demo` (optional run id) |
| Status | `SDD: status` |

You may also treat `/sdd <subcommand>` the same way when the user types it.
On `run` / `plan` / `implement` / `research`: open the best-practices catalog for the detected stack **plus security**; cite sources in plan tasks.

## Human vs agent ownership

### Human-owned (edit freely) — **only human iteration surface**

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E); create/adjust acceptance here
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them
- Optional: review that generated executable tests match intent — if not, fix `specs/` and re-run materialize; do **not** hand-edit generated tests to green

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
- Suggest that the human manually fix generated features/steps/e2e or production code to green the suite
- Stop the `/sdd run` auto-loop mid-way to ask the human to fix implementation — keep diagnose→implement→verify until pass or cap; only exit early for **spec** gaps
- Put ticketing secrets on argv or in the repo; use env vars only

## Stack detection (from specification docs)

The stack adapter is identified from **specification documents**, not by inventing from application source heuristics as the primary signal.

### Authoritative order

1. **`.sdd/premises.md`** — `## Stack` section (preferred). Keywords/synonyms map to canonical ids (`python`/`pytest` → `python`, `react`/`vite` → `react-vite`, `graphql` → `node-graphql`, `terraform` → `terraform`, `typescript`/`ts` → `typescript`).
2. **`specs/**/*.md`** — YAML frontmatter `stack: <id>`, `@stack:<id>` tags, or a `## Stack` section.
3. **`.sdd/stack.json`** — optional machine-readable override / prior provenance (`{ stack, source, detectedAt }`). Not the only way to set stack.
4. **`sdd.yaml`** `adapter` / `adapters.stack` — **fallback** when premises/specs omit stack (**warn** in status).
5. **Last resort (weak):** `package.json` / `pyproject.toml` / `*.tf` — low confidence; still ask the human to declare stack in premises.

Use `@rogeriobatista/core` `detectStack(projectRoot)` → `{ stack, source, confidence, candidates, warnings, needsClarification }`.

### On init / run / from-ticket

1. **Read** premises + specs and call `detectStack` (or equivalent) **before** materialize/verify.
2. If stack is **missing or ambiguous** (`needsClarification`): **STOP**. Ask the human to declare a single stack in `.sdd/premises.md` under `## Stack`. **Do not invent** a stack.
3. After a clear detection: write/update `.sdd/stack.json` provenance via `writeStackProvenance`, and align `sdd.yaml` `adapter` with `alignSddYamlAdapter` when safe.
4. Status must report the resolved `adapter`, detection `source`, and any fallback warnings.

## Init — scaffold the project for SDD

1. **Detect or confirm the stack** from specification docs (see **Stack detection**):
   - Read `.sdd/premises.md` + `specs/**/*.md` first (`detectStack`).
   - If missing/ambiguous: **STOP** and ask the human to declare stack in `.sdd/premises.md` (`## Stack`). Do not invent.
   - Canonical ids: `typescript` (alias `ts`), `python`, `react-vite`, `node-graphql`, `terraform`.
   - Write `adapter:` in `sdd.yaml` (or `adapters.stack:`) and `.sdd/stack.json` provenance after confirmation.
2. Ensure folders appropriate to the stack:
   - Shared: `specs/`, `.sdd/` (premises, canonical, plan, research, runs, evidence, demo, stack.json), `src/` (or module root for Terraform)
   - TS / node-graphql: `tests/features`, `tests/steps`, and e2e when UI applies
   - python: `tests/`
   - react-vite: `tests/e2e` (+ optional `tests/unit`)
   - terraform: `tests/` for `*.tftest.hcl`
3. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`). Set **stack-specific `runners`** (see adapter README). Optionally include a commented `ticketing:` section for Linear/Jira.
4. Write `.sdd/premises.md` and `specs/_example.md` from shared templates if missing — **declare Stack explicitly** (adapter id + tech) so detection is demonstrable.
5. Scaffold via the matching package (`@rogeriobatista/adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, or `adapter-terraform`) or copy from `examples/`.
6. Install the **host adapter** instruction files for this project (Cursor skill/rules, Claude `CLAUDE.md` + `.claude/skills`, or Copilot `.github/copilot-instructions.md` + prompts) — do not overwrite existing human specs.
7. Do **not** overwrite existing human specs.

Report the tree, the chosen `adapter` (and detection `source`), and tell the user: edit `specs/` (the **only human iteration surface**), or run from-ticket and pause for spec review, then `/sdd run` / `SDD: run` for the **automated loop** (detect → normalize → executable → research → plan → implement → verify → diagnose*) until spec tests pass.

## From-ticket — bootstrap NL specs from Linear or Jira

Bootstrap NL specs from a **Linear** or **Jira** ticket, then **pause for human spec iteration** (the only human gate) before the automated `/sdd run` loop — unless `--run` and the draft specs are already complete enough to enter the auto-loop.

### Usage (host-agnostic intents)

- `from-ticket ENG-123` — auto-detect when possible; for ambiguous `KEY-123` use `sdd.yaml` `ticketing.defaultProvider` or a prefix
- `from-ticket linear:ENG-123` or `from-ticket jira:SHOP-7`
- `from-ticket ENG-123 --run` — after writing the draft, continue into the full auto-loop **only if** specs are complete/testable; otherwise still pause for human enrichment

### Steps

0. **Confirm stack** via stack detection (premises + specs) before or as part of continuing into `--run`. If stack is missing/ambiguous, STOP and ask the human to declare it in `.sdd/premises.md` before materialize/verify.
1. Read `sdd.yaml` `ticketing` (provider configs = **env var names only**, never secrets on argv).
2. Resolve provider:
   - UUID → Linear
   - `linear:` / `jira:` prefix → that provider
   - Ambiguous `KEY-123` → `ticketing.defaultProvider`, else ask the human
3. Fetch via `@rogeriobatista/core` (`fromTicket` / `LinearProvider` / `JiraProvider`):
   - Linear: `LINEAR_API_KEY` (GraphQL)
   - Jira: `JIRA_BASE_URL` + `JIRA_API_TOKEN` (+ `JIRA_EMAIL` for Cloud basic auth; Bearer if email unset)
4. Map title/description/acceptance criteria/labels → Portuguese NL draft (`## Intenção` + `## Cenários` with `Dado`/`Quando`/`Então`).
5. Write `specs/<id>-<slug>.md` and provenance `.sdd/ticket.json`.
6. **Default:** stop and ask the human to review/edit `specs/` (enrich weak AC) — this is the **human iteration surface**. **With `--run`:** if specs are already complete/testable, enter the automated run loop; if not, still pause for human enrichment first.

### Hard rules for from-ticket

- Do **not** invent acceptance criteria or business rules that are not in the ticket.
- If the ticket lacks testable scenarios, ask the human to enrich `specs/` before run — do not fabricate GWT.
- Never print API tokens or put secrets on the command line; use environment variables only.
- Prefer the core helpers (`fromTicket`, providers) over ad-hoc HTTP when available in the workspace.

### Ticketing access by host

- **Cursor / Claude:** prefer MCP Linear/Jira tools when configured; otherwise use core REST/GraphQL providers with env vars.
- **GitHub Copilot (VS Code):** MCP may be unavailable or limited — use `@rogeriobatista/core` providers / REST with env vars (`LINEAR_API_KEY`, `JIRA_*`). Document env setup; never put secrets in chat or repo files.

## Pipeline phases (run)

**Human iteration surface (ONLY):** creating/adjusting NL specs in `specs/` (and clarifying acceptance). Optional review that generated executable tests match intent — if they do not, fix `specs/` and re-materialize; **never** hand-patch generated tests or production code to green the suite.

**Automated loop (no human mid-loop):** after specs are accepted/written, `/sdd run` / `SDD: run` runs:

```text
detect stack → normalize → executable → research → plan → implement → verify
                                                      ↑_________________|
                                                      diagnose → implement*
```

Cap diagnose→implement at `loop.maxDiagnoseIterations` (default 3). Do **not** stop mid-loop to ask the human to fix code. If failures look like **wrong/ambiguous specs**, exit the loop and ask the human to iterate on `specs/` (the only human gate). On green (or after the loop ends with a report), remind about **demo** / evidence update.

**Before normalize/executable:** run **stack detection** (`detectStack` on premises + specs). If missing/ambiguous, **STOP** and ask the human to declare stack in `.sdd/premises.md`. After a clear result, update `.sdd/stack.json` and align `sdd.yaml` `adapter` when safe. Prefer the detected stack over a stale hard-coded yaml-only choice; if falling back to `sdd.yaml`, warn in status.

### 1. normalize

- Read all `specs/*.md` (ignore `_example.md` unless it is the only content and user intends to use it).
- Read `.sdd/premises.md`.
- Produce `.sdd/canonical/*.json` with stable scenario ids, Portuguese steps (`Dado`/`Quando`/`Então`/`E`), and tags.
- **If ambiguous:** stop the auto-loop. Ask the human to clarify in `specs/`. Do **not** invent business rules.

### 2. executable

Materialize from canonical using the stack adapter (regenerate freely; never ask the human to edit these files to green the suite):

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

### 7. diagnose (on failure) — auto-loop

- Fix **implementation** against failing tests only; loop back to implement → verify.
- **Do not** ask the human to fix code mid-loop.
- If the **spec** is wrong/ambiguous (requirement gap), **exit the loop** and ask the human to edit `specs/` — do not silently change specs.
- Continue until green or `loop.maxDiagnoseIterations` (default 3).

### 8. report

- Summarize pass/fail, remaining failures, and paths to reports.
- **Cap exceeded:** write the run report. If failures look like requirement gaps / ambiguous acceptance, point the human back to `specs/` (only human gate). Otherwise report remaining test failures for the next auto-loop after any needed spec fix.
- After green (or after the loop ends with a report), prefer `updateEvidencePack` and optionally remind the human to run **demo** for the PO/BO/QA pack.

## Verify (tests only)

Run `runners.all` (or the stack-specific runner the user names). Do not normalize or implement.

## Demo (after verify)

Build a PO/BO/QA demo pack from the latest (or named) run evidence via `@rogeriobatista/core` `buildDemo({ projectRoot, runId?, evidenceKey? })` → `.sdd/evidence/<key>/latest/demo/` (`index.html`, `SUMMARY.md`, `manifest.json`). Key comes from ticket / `evidence.key` / stable local id. Full procedure is in the **Demo** section. Runs **after** green (or after the auto-loop ends with a report) — not mid-loop; invoke explicitly (`demo` / `/sdd demo` / `SDD: demo`). After verify, prefer calling `updateEvidencePack` so `latest/raw` stays current even before demo.

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

## Demo (stakeholder pack from test evidence)

After **verify** (green or red), build a presentable demo pack for **PO / BO / QA** from run evidence + business wording in specs/canonical.

Evidence is keyed by the **Jira/Linear task id** (or a stable local id when there is no ticket) so the **same pack is updated in place** as development progresses.

### Usage (host-agnostic)

- `demo` — use the latest `.sdd/runs/<id>/` and update the evidence pack for the resolved key
- `demo <runId>` — use a specific run folder
- `demo --id <key>` — override the evidence key (also: `sdd.yaml` `evidence.key`)
- Cursor: `/sdd demo` · Claude / Copilot: `SDD: demo`

### Evidence key (`evidenceKey`)

| Source (priority) | Example key | On-disk folder |
|-------------------|-------------|----------------|
| CLI `--id` / `buildDemo({ evidenceKey })` | `linear:ENG-42` | `.sdd/evidence/linear_ENG-42/` |
| `sdd.yaml` `evidence.key` | `jira:SHOP-7` | `.sdd/evidence/jira_SHOP-7/` |
| `.sdd/ticket.json` (from-ticket) | `linear:ENG-42` | `.sdd/evidence/linear_ENG-42/` |
| Auto `.sdd/evidence-id.json` (once) | `local:<uuid>` | `.sdd/evidence/local_<uuid>/` |

Colon in the logical key is encoded as `_` in path segments (Windows-safe).

### Steps

1. Resolve the run id (latest under `.sdd/runs/`, or the id the human named).
2. Resolve `evidenceKey` via `@rogeriobatista/core` `resolveEvidenceKey(projectRoot)` (or pass `--id`).
3. Call `buildDemo({ projectRoot, runId?, evidenceKey? })` — writes/updates the pack and calls `updateEvidencePack`.
4. Report the **stable stakeholder path** (same path updates over time).

### Output (agent-owned) — open this

**PO / BO / QA always open:**

`.sdd/evidence/<encodedKey>/latest/demo/index.html`

Layout (updated in place):

```
.sdd/evidence/<encodedKey>/
  meta.json          # ticket url/title, updatedAt, lastRunId, status, runPath
  latest/
    run-report.json
    demo/            # index.html, SUMMARY.md, manifest.json, evidence/
    raw/             # copied cucumber/playwright/pytest artifacts from last verify
  history/           # optional last N run snapshots by runId
```

Internal runs stay under `.sdd/runs/<runId>/` and are linked from `meta.json`. A legacy copy may also exist under `.sdd/demo/<runId>/` — prefer the evidence path above.

### Core API

- `resolveEvidenceKey(projectRoot)` → `{ evidenceKey, source, evidencePath, … }`
- `updateEvidencePack({ projectRoot, runId, evidenceKey? })` — called from `buildDemo` and verify post-hooks
- `buildDemo({ projectRoot, runId?, evidenceKey? })`

### Inputs (graceful if missing)

- `.sdd/runs/<id>/report.json` (or `run.json`)
- Stack evidence (see adapter READMEs): Playwright `playwright-report/` + `test-results/`, Cucumber `reports/cucumber.json`, pytest `reports/junit.xml`, Vitest JSON, Terraform test log
- `.sdd/canonical/**` and/or `specs/**/*.md` for intention + Dado/Quando/Então wording

Missing evidence is OK — still produce the narrative from the run report + specs. Never block demo on a red verify.

### Audience rules

- **PO / BO / QA** — business language from specs; **no code dumps**, no IDE required
- Portuguese stakeholder copy by default
- **No secrets** in demo/evidence output (scrub tokens/keys from stderr snippets)
- Keep the pack **offline-friendly** (relative paths)

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit generated tests, plan, canonical, or production code for the happy path.
- **Human iteration surface (ONLY):** `specs/` (+ clarifying acceptance; optional review that executable tests match intent). All other `/sdd run` phases are an **automated loop** until spec tests pass or the diagnose cap — do **not** stop mid-loop to ask the human to fix code.
- If failures look like **wrong/ambiguous specs**, exit the auto-loop and ask the human to iterate on `specs/` — the only human gate.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags (default TS/UI stacks): `@api` → API/Cucumber/pytest track; `@ui`/`@e2e` → Playwright when the adapter supports UI.
- Stack adapters are first-class: `typescript` | `python` | `react-vite` | `node-graphql` | `terraform` (alias `ts` → `typescript`).
- **Stack comes from specification docs** (premises → specs → optional stack.json / sdd.yaml fallback). If missing/ambiguous: stop and ask the human — never invent a stack from app source as the primary signal.
- Terraform verify: no cloud apply / no secrets required for default runners.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status / demo) — not file watch.
- Evidence packs (`.sdd/evidence/<key>/latest/demo/`) are for PO/BO/QA: Portuguese business language from specs, no code dumps, no secrets, offline-relative paths. Same key updates in place as development progresses. Demo/evidence update runs **after** green or after the auto-loop ends with a report.
- **Research / best practices:** before `plan`/`implement`, open the curated catalog (`best-practices-catalog`) for the detected stack **plus security**. Cite sources in plan tasks; do not invent uncited practices. Premises override catalog on conflict (note it). Links + short guidance only — no scraping copyrighted full docs into the repo.

## Template locations in this kit

- Shared source: `packages/adapter-shared/content/` (pipeline, research, from-ticket, human boundary, hard rules, best-practices catalog)
- Best-practices catalog: `packages/adapter-shared/content/best-practices-catalog.md` (+ `.json`)
- Shared scaffold: `packages/adapter-shared/templates/` (`sdd.yaml`, `specs/_example.md`, `.sdd/premises.md`)
- Stack adapters: `adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, `adapter-terraform`
- Examples: `coupon-checkout/`, `python-pytest-hello/`, `react-vite-playwright/`, `node-graphql-api/`, `terraform-module/`
- Offline ticket fixture: `packages/core/src/ticketing/fixtures/`

