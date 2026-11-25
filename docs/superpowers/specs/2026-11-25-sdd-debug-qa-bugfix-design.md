# SDD debug / QA / bugfix — Design

**Date:** 2026-11-25  
**Status:** Approved  
**Parent:** [2026-11-24-sdd-dev-kit-design.md](./2026-11-24-sdd-dev-kit-design.md)

## Goal

First-class tooling for **debug, QA, and bugfix** when clients report errors — capture → reproduce (failing test) → diagnose → fix (TDD loop) → QA sign-off → refresh stakeholder evidence.

User ask: *“Quero que no kit tenham ferramentas para debug, QA e bugfix, que serão muito importantes para correção de erros reportados pelo cliente.”*

## Placement

Parallel workflow alongside the canonical 11-step flow (not a replacement for `/sdd run`). Reuses evidence keys, research catalog, and verify/demo helpers.

```text
client report → bug-report (REPORT.md)
             → reproduce (failing Spec/e2e under tests/)
             → debug (DEBUG.md) ↔ research on uncertainty
             → fix (implement loop; blocked without red regression)
             → qa (QA.md) + evidence latest/demo refresh
```

## Commands / intents

| Intent | Cursor | Claude | Copilot | CLI |
|--------|--------|--------|---------|-----|
| Capture | `/sdd bug report` | `SDD: bug report` | `SDD: bug report` / `/sdd-bug-report` | `sdd bug-report [id]` |
| Regress | `/sdd reproduce` | `SDD: reproduce` | `/sdd-reproduce` | `sdd reproduce <id>` |
| Diagnose | `/sdd debug` | `SDD: debug` | `/sdd-debug` | `sdd debug <id>` |
| QA | `/sdd qa` | `SDD: qa` | `/sdd-qa` | `sdd qa <id>` |
| Fix | `/sdd fix` | `SDD: fix` | `/sdd-fix` | `sdd fix <id>` |

## Bug id

1. Prefer ticket form: `linear:ENG-42` / `jira:SHOP-7` (aligns `evidenceKey` with existing evidence packs).
2. Else stable local: `bug_<uuid>` under `.sdd/bugs/`.
3. Disk segment: encode like evidence (`:` → `_`).

Core: `parseBugId`, `encodeBugIdForPath`, `resolveBugPaths`, `ensureBugReport`, `listBugIds`.

## Artifact layout

```text
.sdd/bugs/<encodedId>/
  REPORT.md   # human-owned (PT)
  DEBUG.md    # agent diagnose log (PT)
  QA.md       # QA sign-off (PT)
  meta.json   # bugId, evidenceKey, status, regressionTest
```

Templates (adapter-shared): `templates/.sdd/bugs/_templates/{REPORT,DEBUG,QA}.md`.

## Hard rules

- **Never fix** without a failing regression from `reproduce` first (TDD for bugs).
- Human may refine `REPORT.md` like `specs/`; agent owns DEBUG/QA/meta, regression tests, code.
- After fix: update `.sdd/evidence/<key>/latest/` (demo for PO/BO/QA).
- On uncertainty: open best-practices catalog (existing research / step 11).
- No secrets in REPORT/DEBUG/QA/argv.

## Host sync

- Shared content: `bugfix.md` rendered into Cursor / Claude / Copilot via `npm run sync:adapters`.
- Copilot prompts: `sdd-bug-report`, `sdd-reproduce`, `sdd-debug`, `sdd-qa`, `sdd-fix`.
- CLI: scaffold + guidance; heavy LLM work stays host-driven.
- Human-boundary + hard-rules updated; `HUMAN_ITERATIVE_PHASES` includes `bug-report`.

## Tests

- Core: parseBugId / encode / resolveBugPaths / ensureBugReport
- adapter-shared: templates exist (PT markers); bugfix.md markers; copilot prompts present
- CLI: bug-report writes files; fix blocked without `regressionTest`

## Constraints

- Portuguese templates for client/QA-facing docs
- No secrets; no force-push
- Evidence key alignment when ticket-linked
