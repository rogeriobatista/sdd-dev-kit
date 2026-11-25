# SDD documentation tooling — Design

**Date:** 2026-11-25  
**Status:** Approved  
**Parent:** [2026-11-24-sdd-dev-kit-design.md](./2026-11-24-sdd-dev-kit-design.md)

## Goal

Add **documentation tooling** so everything delivered by the SDD pipeline can be documented at a professional level for PO/BO/QA and developers — without inventing features not present in `specs/` / premises.

User ask: *“Quero que tenha ferramentar de documentação também, para que seja possível documentar tudo que foi feito para assim ficar 100% profissional.”*

## Commands / skill intents

| Intent | Invoke |
|--------|--------|
| Full docs pack | `sdd docs` / `/sdd docs` / `SDD: docs` |
| Changelog only | `sdd docs changelog` / `/sdd docs changelog` |
| API/module stubs | `sdd docs api` / `/sdd docs api` |
| Handoff (PT) | `sdd docs handoff` / `/sdd docs handoff` |

## Pipeline placement

**Optional** phase after evidence (step 10), or explicit command. Not part of the required auto-loop steps 2–10.

```text
… → evidence → (optional) docs
```

Host adapters may run docs after evidence when the human asks for a professional pack, or leave it to the explicit command.

## Output layout (agent-owned)

```text
docs/sdd/
  README.md           # índice profissional
  PRODUCT.md          # o que foi pedido (from specs)
  TECHNICAL.md        # from dev-spec + design-approach (+ plan)
  CHANGELOG.md        # from runs / evidence / tickets
  HANDOFF.md          # PO/BO/QA/dev handoff (PT)
  ADR/                # ADRs from design/research (when decisions exist)
  API.md              # optional stubs (GraphQL schema / exports) when applicable
```

Also link to `.sdd/evidence/<key>/latest/demo/` (stakeholder proof). Root `CHANGELOG.md` may be updated to point at or mirror `docs/sdd/CHANGELOG.md`.

## Sources (no invention)

| Doc | Reads from (graceful if missing) |
|-----|----------------------------------|
| PRODUCT | `specs/**/*.md`, `.sdd/canonical/**` |
| TECHNICAL | `.sdd/dev-spec.md`, `.sdd/design-approach.md`, `.sdd/implementation-plan.md` |
| CHANGELOG | `.sdd/runs/**`, `.sdd/evidence/**/meta.json`, `.sdd/ticket.json` |
| HANDOFF | specs + evidence demo path + ticket provenance |
| ADR | design-approach + `.sdd/research/**` decision notes |
| API | stack-aware: GraphQL schema / public exports when present |

**Hard rule:** docs must **not** invent features, AC, or business rules missing from specs/premises. Missing sources → placeholders / “não informado nas specs”, never fabricated narrative.

## Templates

Stakeholder-facing PT templates live under:

`packages/adapter-shared/templates/docs/sdd/`

Shared skill content: `packages/adapter-shared/content/docs.md` (rendered into Cursor / Claude / Copilot via `npm run sync:adapters`).

## Core API

`@rogeriobatista/core`:

- `DOCS_PHASE` / `DEFAULT_PATHS.docs` (`docs/sdd`)
- `docsPackRelPath()`, `docsFileRelPath(name)`, `adrRelPath(slug?)`
- `buildDocs({ projectRoot, mode?, evidenceKey?, writeRootChangelog? })`
- Modes: `all` | `changelog` | `api` | `handoff`

## Constraints

- No secrets in docs output (reuse `scrubSecrets`)
- Premises / specs are source of truth
- Portuguese for HANDOFF and stakeholder-facing sections
- No force-push; version bump is a free patch after parallel releases

## Tests

- Path helpers resolve `docs/sdd/**`
- Templates exist with required section markers (PRODUCT, TECHNICAL, HANDOFF, ADR)
- `buildDocs` writes pack from fixture specs without inventing content
- Host packs include `docs` command markers after render
