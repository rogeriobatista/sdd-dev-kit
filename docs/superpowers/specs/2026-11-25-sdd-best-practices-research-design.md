# SDD best-practices research — Design

**Date:** 2026-11-25  
**Status:** Approved  
**Parent:** [2026-11-24-sdd-dev-kit-design.md](./2026-11-24-sdd-dev-kit-design.md)

## Goal

Extend the SDD development process so **plan** and **implement** always consult market / standards best practices (frontend, backend, infra, security) via a curated catalog and optional live fetch of official docs — never invent uncited “best practices.”

User ask: *“Quero que o processo de desenvolvimento busque referencias de boas práticas… skills ou busca em sites/repositórios para frontend, backend, infra, segurança. Sempre implementar com o que há de melhor no mercado.”*

## Pipeline placement

`research` is an **ordered phase** of `/sdd run` / `SDD: run`, after stack detection + `executable`, **before** `plan`:

```text
stack detect → normalize → executable → research → plan → implement → verify → diagnose → report
```

| Host | Invoke (standalone) |
|------|---------------------|
| Cursor | `/sdd research` (thin skill `sdd-research`) |
| Claude | `SDD: research` |
| Copilot | `SDD: research` / `/sdd-research` |

Standalone refreshes the research pack without a full run. On `plan` / `implement`, the agent must open existing research output or run research first if missing.

## Catalog

**Location:** `packages/adapter-shared/content/best-practices-catalog.md` (+ `best-practices-catalog.json`)

| Field | Role |
|-------|------|
| `catalogVersion` | Bump when entries change materially |
| Domains | Frontend, Backend, Infra, Security |
| Stack map | Which domains to open per adapter id |
| Entries | Official docs / standards URLs + short apply-when guidance |

**Rules:** quality over quantity; official/standards only; **no** scraping copyrighted full docs into the repo; security always included.

## Outputs (agent-owned)

`.sdd/research/<encodedEvidenceKey>/`:

| File | Role |
|------|------|
| `BEST_PRACTICES.md` | Applied practices summary (Portuguese OK for stakeholders) + premises conflicts |
| `sources.json` | `{ catalogVersion, stack, evidenceKey, researchedAt, sources[], premisesConflicts[] }` |

Evidence key resolution matches demo/evidence packs (`resolveEvidenceKey` / `encodeEvidenceKeyForPath`).

## Agent contract

1. Open catalog for detected stack domains **+ security**.
2. Prefer MCP WebSearch / fetch of catalog URLs; else use curated links.
3. Cite source ids/URLs in plan tasks; no uncited practice claims.
4. If conflict with `.sdd/premises.md` → **premises win**; note conflict in `BEST_PRACTICES.md`.
5. No secrets in research output.

## Host sync

- Shared content: `research.md` rendered into Cursor / Claude / Copilot instruction packs via `npm run sync:adapters`.
- Cursor: thin `adapter-cursor/skills/sdd-research/SKILL.md` (+ kit `.cursor/skills/sdd-research`).
- Copilot: `.github/prompts/sdd-research.prompt.md`.
- Core: `PHASES` includes `research`; `RESEARCH_PHASE` exported; `DEFAULT_PATHS.research`.

## Constraints

- Links + short guidance only (no full-doc dumps)
- No secrets
- Curated catalog — avoid random blogs
- Portuguese OK for stakeholder-facing research summary; catalog EN/PT

## Tests

- Catalog file exists with Frontend / Backend / Infra / Security + `catalogVersion`
- Shared `research.md` markers
- Rendered host packs still green (`adapter-shared` template-section tests)
