# SDD evidence keyed by task ID — Design

**Date:** 2026-11-24  
**Status:** Approved  
**Parent:** [2026-11-24-sdd-demo-from-evidence-design.md](./2026-11-24-sdd-demo-from-evidence-design.md)

## Goal

Relate test evidence and demos to a **Jira/Linear task ID** (or a unique stable ID when no ticket) so the **same evidence pack is updated** as development evolves.

User ask: evidence should be tied to the Jira or Linear task ID, or a unique ID when not related to any ticket, so they can always update it as development progresses.

## Evidence key (`evidenceKey`)

| Priority | Source | Example |
|----------|--------|---------|
| 1 | CLI `/sdd demo --id <key>` / `buildDemo({ evidenceKey })` | `linear:ENG-42` |
| 2 | `sdd.yaml` `evidence.key` | `jira:SHOP-7` |
| 3 | `.sdd/ticket.json` from-ticket provenance | `linear:ENG-42` |
| 4 | Persist once `.sdd/evidence-id.json` | `local:<uuid>` |

Logical keys keep the `provider:ID` form. On-disk path segments encode `:` → `_` (Windows-safe): `.sdd/evidence/linear_ENG-42/`.

## Layout (update in place)

```
.sdd/evidence/<encodedKey>/
  meta.json          # ticket url, title, updatedAt, lastRunId, status, runPath
  latest/            # always current pack (overwrite/update)
    run-report.json
    demo/            # index.html, SUMMARY.md, manifest, evidence assets
    raw/             # copied cucumber/playwright/pytest artifacts from last verify
  history/           # optional: keep last N run snapshots by runId (default 5)
```

- `/sdd demo` and verify post-hooks write/update `latest/` for that key
- `.sdd/runs/<runId>` remains for internals; linked from `meta.json`
- Legacy `.sdd/demo/<runId>/` may still be written; **stakeholders open the evidence path**

## Core API

```ts
resolveEvidenceKey(projectRoot) → { evidenceKey, source, evidencePath, … }
updateEvidencePack({ projectRoot, runId, evidenceKey? })
buildDemo({ projectRoot, runId?, evidenceKey? })  // calls updateEvidencePack
```

Ticket provenance (`.sdd/ticket.json`) includes `evidenceKey` + `evidencePath`.

## Host instructions

PO / BO / QA always open:

`.sdd/evidence/<encodedKey>/latest/demo/index.html`

Same path updates over time.

## Constraints

- No secrets in evidence
- Portuguese demo copy unchanged
- No force-push
