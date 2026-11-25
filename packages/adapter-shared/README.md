# @rogeriobatista/adapter-shared

Single source of SDD **pipeline instructions** and **project scaffold templates** used by every AI host adapter (Cursor, Claude, GitHub Copilot).

## Contents

| Path | Role |
|------|------|
| `content/` | Portable protocol: human gate (`specs/`), auto-loop pipeline, from-ticket pause, research, demo, hard rules, catalog |
| `templates/` | `sdd.yaml` (stack adapter ids documented), `specs/_example.md`, `.sdd/premises.md` |
| `scripts/render.mjs` | Renders host packs into `adapter-cursor`, `adapter-claude`, `adapter-vscode-copilot` |

Init content asks the agent to **choose a stack** (`typescript` / `python` / `react-vite` / `node-graphql` / `terraform`) and wire the matching package’s runners.

## Render

After editing `content/` or `templates/`:

```bash
npm run render -w @rogeriobatista/adapter-shared
# or
npm run sync:adapters
```

Do not hand-edit rendered host instruction files; change shared content and re-render.

## Tests

```bash
npm test -w @rogeriobatista/adapter-shared
```

Asserts required sections (pipeline phases, from-ticket, human edit boundary) exist in shared content and in each host’s rendered pack.
