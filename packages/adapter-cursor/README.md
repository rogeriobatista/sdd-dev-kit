# @rogeriobatista/adapter-cursor

Cursor adapter for the SDD Protocol Kit. Installs skills, rules, and templates so the agent can run `/sdd init|from-ticket|run|research|verify|status`.

Pipeline text is rendered from `@rogeriobatista/adapter-shared` — edit shared content, then `npm run sync:adapters`.

## Install into a project

1. Copy `skills/sdd/` and `skills/sdd-research/` into your Cursor skills path (project `.cursor/skills/` or user skills).
2. Copy `rules/sdd-human-edits.mdc` into `.cursor/rules/`.
3. Use templates under `templates/` as the starting layout (`sdd.yaml`, `specs/_example.md`, `.sdd/premises.md`), or run `/sdd init`.

## Commands

| Command | Purpose |
|---------|---------|
| `/sdd init` | Scaffold folders, `sdd.yaml`, premises, example spec, TS test configs |
| `/sdd from-ticket <id>` | Fetch Linear/Jira ticket → draft `specs/*.md` + `.sdd/ticket.json` |
| `/sdd from-ticket <id> --run` | Same; enter auto-loop only if specs are already complete |
| `/sdd run` | Auto-loop after specs: detect → normalize → executable → research → plan → implement → verify (diagnose until pass) |
| `/sdd research` | Best-practices pack from curated catalog (also runs inside `/sdd run`) |
| `/sdd verify` | Run Cucumber + Playwright only |
| `/sdd status` | Summarize last run / phase status from `.sdd/runs` |

## Ticketing / MCP

Prefer Linear/Jira MCP tools when configured in Cursor; otherwise use `@rogeriobatista/core` providers with env vars only.

## Human boundary

You iterate **only** on `specs/` (+ `.sdd/premises.md` when changing project rules). Ticket import drafts `specs/` then pauses for review. After specs are accepted, `/sdd run` auto-loops until tests pass — never hand-edit generated features, steps, e2e, canonical, plan, or code mid-loop.
