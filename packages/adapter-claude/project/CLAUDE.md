# SDD Protocol Kit (Claude)

This project uses Spec-Driven Development. You edit **only** `specs/*.md` (+ `.sdd/premises.md` when changing project rules). The agent owns generated tests, plan, canonical, and implementation under the SDD pipeline.

## Commands (say these in chat)

- **SDD: init** — scaffold folders, `sdd.yaml`, premises, example spec, host instructions
- **SDD: from-ticket `<id>`** — Linear/Jira → draft `specs/*.md` (MCP when available; else core REST + env vars)
- **SDD: run** — full pipeline: normalize → executable → plan → implement → verify (diagnose loop)
- **SDD: verify** — stack runners from `sdd.yaml` only
- **SDD: demo** — stakeholder pack (PO/BO/QA) from test evidence → `.sdd/evidence/<key>/latest/demo/`
- **SDD: status** — last run / phase summary

Full procedures live in `.claude/skills/sdd/SKILL.md` (invoke the `sdd` skill when the user asks for any of the above).

## Ticketing / MCP

- Prefer Linear/Jira **MCP** tools when this host has them configured.
- Otherwise use `@rogeriobatista/core` providers with env vars only: `LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`.
- Never commit secrets or put tokens on the command line.

## Human boundary (summary)

## Human vs agent ownership

### Human-owned (edit freely)

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them

### Agent-owned / regenerable (do not ask the human to edit)

- Generated tests for the active stack (`tests/features/**`, `tests/steps/**`, `tests/e2e/**`, `tests/test_*.py`, `tests/*.tftest.hcl`, `tests/unit/**`, …)
- `.sdd/canonical/**` — normalized scenarios
- `.sdd/plan/**` — SDD task plan
- `.sdd/runs/**` — run reports (internal; linked from evidence meta)
- `.sdd/evidence/**` — stakeholder evidence packs keyed by ticket / stable id (`latest/demo/` is the PO/BO/QA path)
- `.sdd/evidence-id.json` — stable local evidence id when no ticket
- `.sdd/demo/**` — legacy per-run demo copies (prefer `.sdd/evidence/<key>/latest/demo/`)
- `.sdd/ticket.json` — provenance from from-ticket bootstrap (includes `evidenceKey` / `evidencePath`)
- `.sdd/stack.json` — stack detection provenance (agent-owned; human declares stack in premises/specs)
- Production code under the SDD implement phase (agent implements to make tests pass)

### Agent must not

- Edit `specs/` without an explicit human request — **except** writing a draft via from-ticket bootstrap
- Invent business rules or acceptance criteria missing from the ticket/specs — stop and ask for a specs change
- Suggest that the human manually fix generated features/steps/e2e to green the suite
- Put ticketing secrets on argv or in the repo; use env vars only
