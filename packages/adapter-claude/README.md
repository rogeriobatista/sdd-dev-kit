# @rogeriobatista/adapter-claude

Claude Code / Claude-in-VS-Code adapter for the SDD Protocol Kit. Installs project instructions and an `sdd` skill so the same pipeline works outside Cursor.

## Install into a project

1. Copy `project/CLAUDE.md` → repository root `CLAUDE.md` (or merge with an existing one).
2. Copy `project/.claude/skills/sdd/` → `.claude/skills/sdd/`.
3. Copy scaffold templates from `@rogeriobatista/adapter-shared/templates/` (or ask **SDD: init**), then add Cucumber/Playwright via `@rogeriobatista/adapter-ts` if needed.

Instruction body is rendered from `packages/adapter-shared/content/` — edit shared content and run `npm run sync:adapters`, do not diverge by hand.

## Commands (chat intents)

| Say | Purpose |
|-----|---------|
| `SDD: init` | Scaffold folders, `sdd.yaml`, premises, example spec, Claude files |
| `SDD: from-ticket <id>` | Fetch Linear/Jira → draft `specs/*.md` + `.sdd/ticket.json` |
| `SDD: from-ticket <id> --run` | Same; enter auto-loop only if specs are already complete |
| `SDD: run` | Auto-loop after specs: detect → normalize → executable → research → plan → implement → verify (diagnose until pass) |
| `SDD: verify` | Run Cucumber + Playwright only |
| `SDD: status` | Summarize last run / phase status |

`/sdd <subcommand>` is treated the same when typed.

## Ticketing / MCP

- Prefer Linear/Jira **MCP** when configured in Claude.
- Fallback: `@rogeriobatista/core` providers + env vars (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`).
- Never commit secrets.

## Human boundary

You iterate **only** on `specs/` (+ `.sdd/premises.md` when changing project rules). Ticket import drafts `specs/` then pauses for review. After specs are accepted, `SDD: run` auto-loops until tests pass — never hand-edit generated artifacts or code mid-loop.
