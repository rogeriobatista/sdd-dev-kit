# @sdd-dev-kit/adapter-cursor

Cursor adapter for the SDD Protocol Kit. Installs skills, rules, and templates so the agent can run `/sdd init|from-ticket|run|verify|status`.

## Install into a project

1. Copy `skills/sdd/` into your Cursor skills path (project `.cursor/skills/sdd/` or user skills).
2. Copy `rules/sdd-human-edits.mdc` into `.cursor/rules/`.
3. Use templates under `templates/` as the starting layout (`sdd.yaml`, `specs/_example.md`, `.sdd/premises.md`), or run `/sdd init`.

## Commands

| Command | Purpose |
|---------|---------|
| `/sdd init` | Scaffold folders, `sdd.yaml`, premises, example spec, TS test configs |
| `/sdd from-ticket <id>` | Fetch Linear/Jira ticket → draft `specs/*.md` + `.sdd/ticket.json` |
| `/sdd from-ticket <id> --run` | Same, then continue with the full `/sdd run` pipeline |
| `/sdd run` | Full pipeline: normalize → executable → plan → implement → verify (diagnose loop) |
| `/sdd verify` | Run Cucumber + Playwright only |
| `/sdd status` | Summarize last run / phase status from `.sdd/runs` |

## Human boundary

You edit **only** `specs/` (+ `.sdd/premises.md` when changing project rules). Ticket import drafts `specs/`; you may refine them before run. Never hand-edit generated features, steps, e2e, canonical, or plan.
