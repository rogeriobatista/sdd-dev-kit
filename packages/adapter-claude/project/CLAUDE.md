# SDD Protocol Kit (Claude)

This project uses Spec-Driven Development. You edit **only** `specs/*.md` (+ `.sdd/premises.md` when changing project rules). The agent owns generated tests, plan, canonical, and implementation under the SDD pipeline.

## Commands (say these in chat)

- **SDD: init** — scaffold folders, `sdd.yaml`, premises, example spec, host instructions
- **SDD: from-ticket `<id>`** — Linear/Jira → draft `specs/*.md` (MCP when available; else core REST + env vars)
- **SDD: run** — full pipeline: normalize → executable → plan → implement → verify (diagnose loop)
- **SDD: verify** — Cucumber + Playwright only
- **SDD: status** — last run / phase summary

Full procedures live in `.claude/skills/sdd/SKILL.md` (invoke the `sdd` skill when the user asks for any of the above).

## Ticketing / MCP

- Prefer Linear/Jira **MCP** tools when this host has them configured.
- Otherwise use `@sdd-dev-kit/core` providers with env vars only: `LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`.
- Never commit secrets or put tokens on the command line.

## Human boundary (summary)

## Human vs agent ownership

### Human-owned (edit freely)

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them

### Agent-owned / regenerable (do not ask the human to edit)

- `tests/features/**` — Cucumber `.feature`
- `tests/steps/**` — step definitions
- `tests/e2e/**` — Playwright specs
- `.sdd/canonical/**` — normalized scenarios
- `.sdd/plan/**` — SDD task plan
- `.sdd/runs/**` — run reports
- `.sdd/ticket.json` — provenance from from-ticket bootstrap
- `src/**` under the SDD implement phase (agent implements to make tests pass)

### Agent must not

- Edit `specs/` without an explicit human request — **except** writing a draft via from-ticket bootstrap
- Invent business rules or acceptance criteria missing from the ticket/specs — stop and ask for a specs change
- Suggest that the human manually fix generated features/steps/e2e to green the suite
- Put ticketing secrets on argv or in the repo; use env vars only
