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
