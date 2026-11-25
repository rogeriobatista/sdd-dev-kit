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
