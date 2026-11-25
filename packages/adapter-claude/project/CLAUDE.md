# SDD Protocol Kit (Claude)

This project uses Spec-Driven Development. You edit **only** `specs/*.md` (+ `.sdd/premises.md` when changing project rules). The agent owns Spec Tests, Dev Spec, Implementation Plan, Design Approach, unit/integration/e2e tests, canonical, research, evidence, and implementation under the SDD pipeline.

## Commands (say these in chat)

- **SDD: init** — scaffold folders, `sdd.yaml`, premises, example spec, host instructions
- **SDD: from-ticket `<id>`** — Linear/Jira → draft `specs/*.md`, then pause for human spec iteration (unless `--run` + complete specs)
- **SDD: run** — canonical steps 2–10 after specs (spec-tests → … → evidence; implement/verify until all layers pass)
- **SDD: research** — best-practices pack (step 11 continuous policy; optional standalone)
- **SDD: verify** — stack runners from `sdd.yaml` (spec/unit/integration/e2e/all)
- **SDD: demo** — stakeholder pack (PO/BO/QA) from test evidence → `.sdd/evidence/<key>/latest/demo/`
- **SDD: docs** — professional docs pack → `docs/sdd/` (optional after evidence; no invented features)
- **SDD: status** — last run / phase summary
- **SDD: bug report** / **reproduce** / **debug** / **qa** / **fix** — client-reported error workflow (TDD: no fix without red regression)

Full procedures live in `.claude/skills/sdd/SKILL.md` (invoke the `sdd` skill when the user asks for any of the above).
User guide (PT, passo a passo + exemplos): `docs/guia-de-uso.md`.

## Ticketing / MCP

- Prefer Linear/Jira **MCP** tools when this host has them configured.
- Otherwise use `@rogeriobatista/core` providers with env vars only: `LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`.
- Never commit secrets or put tokens on the command line.

## Human boundary (summary)

## Human vs agent ownership

### Human-owned (edit freely) — **only human iteration surface**

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E); create/adjust acceptance here (canonical **step 1**)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them
- `.sdd/bugs/<id>/REPORT.md` — client bug report (passos, esperado/atual, severidade, ambiente); refine like specs
- Optional: review that generated Spec Tests match intent — if not, fix `specs/` and re-run materialize; do **not** hand-edit generated tests to green

### Agent-owned / regenerable (do not ask the human to edit)

- Executable Spec Tests (`tests/features/**`, `tests/spec/**`, `tests/steps/**`, `tests/test_*.py`, `tests/*.tftest.hcl`, …) — **step 2**
- `.sdd/dev-spec.md` — Dev Spec — **step 3**
- `.sdd/implementation-plan.md` — Dev Implementation Plan — **step 4** (legacy `.sdd/plan/**` optional)
- `.sdd/design-approach.md` — Design & Approach — **step 5**
- `tests/unit/**` — unit tests — **step 6**
- `tests/integration/**` — integration tests — **step 7**
- `tests/e2e/**` — e2e tests — **step 8**
- Regression tests created by `/sdd reproduce` under `tests/`
- `.sdd/canonical/**` — normalized scenarios (supports step 2)
- `.sdd/research/**` — best-practices research packs (`BEST_PRACTICES.md`, `sources.json`) — **step 11 support**
- `.sdd/runs/**` — run reports (internal; linked from evidence meta)
- `.sdd/evidence/**` — stakeholder evidence packs keyed by ticket / stable id (`latest/demo/` is the PO/BO/QA path) — **step 10**
- `.sdd/evidence-id.json` — stable local evidence id when no ticket
- `.sdd/demo/**` — legacy per-run demo copies (prefer `.sdd/evidence/<key>/latest/demo/`)
- `.sdd/bugs/<id>/{DEBUG,QA}.md` + `meta.json` — debug log, QA sign-off, bug provenance
- `docs/sdd/**` — professional documentation pack (PRODUCT / TECHNICAL / CHANGELOG / HANDOFF / ADR / API) — optional after evidence; `/sdd docs`
- `.sdd/ticket.json` — provenance from from-ticket bootstrap (includes `evidenceKey` / `evidencePath`)
- `.sdd/stack.json` — stack detection provenance (agent-owned; human declares stack in premises/specs)
- Production code under the SDD implement loop (**step 9**) and `/sdd fix`

### Agent must not

- Edit `specs/` without an explicit human request — **except** writing a draft via from-ticket bootstrap
- Invent business rules or acceptance criteria missing from the ticket/specs — stop and ask for a specs change
- Invent bug reproduction steps missing from the client `REPORT.md`
- Invent product features or acceptance criteria in `docs/sdd/**` that are missing from `specs/` / premises
- Suggest that the human manually fix generated Spec/unit/integration/e2e tests or production code to green the suite
- Stop the `/sdd run` auto-loop mid-way to ask the human to fix implementation — keep diagnose→implement→verify until all test levels pass or cap; only exit early for **spec** gaps
- Enter `/sdd fix` without a failing regression from `/sdd reproduce` first (TDD for bugs)
- Put ticketing secrets on argv or in the repo; use env vars only
