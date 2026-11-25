---
name: sdd-docs
description: Generate professional documentation pack (SDD: docs)
agent: agent
argument-hint: [all|changelog|api|handoff] [--id <evidenceKey>]
---
Run **SDD: docs** — generate/update the professional documentation pack under `docs/sdd/`.

## Docs (documentation pack)

Generate or refresh a **professional documentation pack** from specs, Dev Spec, plan, design, research, evidence, and (if present) bug folders — **without inventing features** not in `specs/` / premises.

### Usage (host-agnostic)

- `docs` — full pack under `docs/sdd/`
- `docs changelog` — update CHANGELOG from runs / evidence / tickets
- `docs api` — API/module stubs from stack (GraphQL schema / exports) when applicable
- `docs handoff` — PO/BO/QA/dev handoff in Portuguese
- Cursor: `/sdd docs` · Claude / Copilot: `SDD: docs`

CLI: `sdd docs` / `sdd docs changelog` / `sdd docs api` / `sdd docs handoff`

### Pipeline placement

**Optional** after evidence (step 10), or explicit command. Not required inside the auto-loop steps 2–10.

```text
… → evidence → (optional) docs
```

### Output (agent-owned)

```
docs/sdd/
  README.md           # índice profissional
  PRODUCT.md          # o que foi pedido (from specs)
  TECHNICAL.md        # from dev-spec + design-approach (+ plan)
  CHANGELOG.md        # from runs / evidence / tickets
  HANDOFF.md          # para solicitante (PT)
  ADR/                # architecture decision records from design/research
  API.md              # optional (sdd docs api)
```

Link stakeholders to `.sdd/evidence/<key>/latest/demo/`. Prefer `buildDocs({ projectRoot, mode? })` from `@rogeriobatista/core`.

### Steps

1. Resolve `evidenceKey` via `resolveEvidenceKey(projectRoot)` (or `--id`).
2. Collect sources that exist: `specs/`, `.sdd/dev-spec.md`, `.sdd/implementation-plan.md`, `.sdd/design-approach.md`, `.sdd/research/`, `.sdd/runs/`, `.sdd/evidence/`, `.sdd/ticket.json`, optional bug folders under `.sdd/bugs/` or `docs` inputs.
3. Call `buildDocs({ projectRoot, mode: "all"|"changelog"|"api"|"handoff" })`.
4. Report paths written. Do **not** invent AC or product features missing from specs — mark gaps instead.

### Hard rules for docs

- Specs / premises are source of truth — **no invented features**.
- Portuguese for HANDOFF and stakeholder-facing copy.
- No secrets (scrub tokens/keys).
- Templates: `packages/adapter-shared/templates/docs/sdd/` (PT).

Prefer `buildDocs({ projectRoot, mode? })` from `@rogeriobatista/core`. Do **not** invent features missing from specs. Report paths written and link to `.sdd/evidence/<key>/latest/demo/`.
