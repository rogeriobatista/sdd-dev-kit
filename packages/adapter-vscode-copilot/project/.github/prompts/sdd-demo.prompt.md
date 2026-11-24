---
name: sdd-demo
description: Build a PO/BO/QA demo pack from test evidence (SDD: demo)
agent: agent
argument-hint: [runId]
---
Run **SDD: demo** — build a stakeholder demo pack from the latest (or named) verify evidence.

## Demo (stakeholder pack from test evidence)

After **verify** (green or red), build a presentable demo pack for **PO / BO / QA** from run evidence + business wording in specs/canonical.

### Usage (host-agnostic)

- `demo` — use the latest `.sdd/runs/<id>/`
- `demo <runId>` — use a specific run folder
- Cursor: `/sdd demo` · Claude / Copilot: `SDD: demo`

### Steps

1. Resolve the run id (latest under `.sdd/runs/`, or the id the human named).
2. Call `@sdd-dev-kit/core` `buildDemo({ projectRoot, runId? })` (preferred) — or equivalent: collect evidence, map scenarios, write the pack.
3. Report the output paths to the human (open `index.html` in a browser; paste `SUMMARY.md` into Slack/email).

### Output (agent-owned)

`.sdd/demo/<runId>/`:

| File | Role |
|------|------|
| `index.html` | Offline-friendly narrative page in **Portuguese** (intent, scenarios as business language, pass/fail, embeds/links to screenshots/videos) |
| `SUMMARY.md` | Same story in markdown for Slack/email |
| `manifest.json` | Machine-readable evidence list |
| `evidence/` | Copied reports/media so the pack is portable |

### Inputs (graceful if missing)

- `.sdd/runs/<id>/report.json` (or `run.json`)
- Stack evidence (see adapter READMEs): Playwright `playwright-report/` + `test-results/`, Cucumber `reports/cucumber.json`, pytest `reports/junit.xml`, Vitest JSON, Terraform test log
- `.sdd/canonical/**` and/or `specs/**/*.md` for intention + Dado/Quando/Então wording

Missing evidence is OK — still produce the narrative from the run report + specs. Never block demo on a red verify.

### Audience rules

- **PO / BO / QA** — business language from specs; **no code dumps**, no IDE required
- Portuguese stakeholder copy by default
- **No secrets** in demo output (scrub tokens/keys from stderr snippets)
- Keep the pack **offline-friendly** (relative paths)

Prefer `buildDemo({ projectRoot, runId? })` from `@sdd-dev-kit/core`. Report `.sdd/demo/<runId>/index.html` and `SUMMARY.md` paths.
