# @rogeriobatista/adapter-vscode-copilot

GitHub Copilot (VS Code) adapter for the SDD Protocol Kit. Ships repository custom instructions and reusable prompt files — **not** a VS Code extension.

## Install into a project

1. Copy `project/.github/copilot-instructions.md` → `.github/copilot-instructions.md`.
2. Copy `project/.github/prompts/*.prompt.md` → `.github/prompts/`.
3. Ensure Copilot custom instructions are enabled in VS Code.
4. Copy scaffold templates from `@rogeriobatista/adapter-shared/templates/` (or ask **SDD: init**), then add Cucumber/Playwright via `@rogeriobatista/adapter-ts` if needed.

Instruction body is rendered from `packages/adapter-shared/content/` — edit shared content and run `npm run sync:adapters`.

## Commands

| Chat / prompt | Purpose |
|---------------|---------|
| `SDD: init` or `/sdd-init` | Scaffold project + Copilot files |
| `SDD: from-ticket <id>` or `/sdd-from-ticket` | Linear/Jira → draft specs (pause for human iteration) |
| `SDD: run` or `/sdd-run` | Auto-loop until spec tests pass |
| `SDD: verify` or `/sdd-verify` | Tests only |
| `SDD: status` or `/sdd-status` | Last run summary |

## Ticketing gap (important)

- Cursor and Claude often use **MCP** for Linear/Jira.
- Copilot may lack the same MCP surface — use `@rogeriobatista/core` REST/GraphQL providers with env vars only (`LINEAR_API_KEY`, `JIRA_*`).
- Do not paste tokens into chat.

## Human boundary

You iterate **only** on `specs/` (+ `.sdd/premises.md` when changing project rules). After specs are accepted, `SDD: run` auto-loops until tests pass — never hand-edit generated features, steps, e2e, canonical, plan, or code mid-loop.
