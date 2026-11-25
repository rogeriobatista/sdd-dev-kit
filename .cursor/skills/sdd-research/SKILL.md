---
name: sdd-research
description: >-
  SDD best-practices research. Use when the user invokes /sdd research, SDD: research,
  or when plan/implement needs market standards for frontend, backend, infra, or security.
---

# /sdd research — Best practices

Thin Cursor skill: follow the **Research (best practices)** procedure from the main `sdd` skill / shared content.

## Catalog (open first)

- `packages/adapter-shared/content/best-practices-catalog.md`
- `packages/adapter-shared/content/best-practices-catalog.json` (`catalogVersion`)

Select domains for the **detected stack** + **security (always)**. Prefer MCP WebSearch / fetch of catalog URLs; otherwise use the curated links.

## Output (agent-owned)

`.sdd/research/<encodedEvidenceKey>/BEST_PRACTICES.md` + `sources.json`

Cite every applied practice in Dev Spec / Implementation Plan / Design Approach. Premises win on conflict — note it. No scraping of full copyrighted docs; no secrets. Step 11 is continuous during `/sdd run`, not a separate stop.

Full steps: shared `research.md` (rendered into the `sdd` skill).
