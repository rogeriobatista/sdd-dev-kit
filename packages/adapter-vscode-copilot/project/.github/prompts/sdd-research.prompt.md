---
name: sdd-research
description: Research market best practices for the detected stack (SDD: research)
agent: agent
---
Run **SDD: research** — consult the curated best-practices catalog for the detected stack **plus security**, then write `.sdd/research/<key>/BEST_PRACTICES.md` + `sources.json`.

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

Open `packages/adapter-shared/content/best-practices-catalog.md` (and `.json`). Prefer MCP WebSearch / fetch of official catalog URLs. Cite sources; premises win on conflict. No scraping of full copyrighted docs; no secrets.
