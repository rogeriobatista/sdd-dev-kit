# @sdd-dev-kit/adapter-shared

Single source of SDD **pipeline instructions** and **project scaffold templates** used by every AI host adapter (Cursor, Claude, GitHub Copilot).

## Contents

| Path | Role |
|------|------|
| `content/` | Portable protocol: human boundary, init, from-ticket, pipeline phases, hard rules |
| `templates/` | `sdd.yaml`, `specs/_example.md`, `.sdd/premises.md` |
| `scripts/render.mjs` | Renders host packs into `adapter-cursor`, `adapter-claude`, `adapter-vscode-copilot` |

## Render

After editing `content/` or `templates/`:

```bash
npm run render -w @sdd-dev-kit/adapter-shared
# or
npm run sync:adapters
```

Do not hand-edit rendered host instruction files; change shared content and re-render.

## Tests

```bash
npm test -w @sdd-dev-kit/adapter-shared
```

Asserts required sections (pipeline phases, from-ticket, human edit boundary) exist in shared content and in each host’s rendered pack.
