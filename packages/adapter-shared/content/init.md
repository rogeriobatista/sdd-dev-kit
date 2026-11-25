## Init — scaffold the project for SDD

1. **Detect or confirm the stack** from specification docs (see **Stack detection**):
   - Read `.sdd/premises.md` + `specs/**/*.md` first (`detectStack`).
   - If missing/ambiguous: **STOP** and ask the human to declare stack in `.sdd/premises.md` (`## Stack`). Do not invent.
   - Canonical ids: `typescript` (alias `ts`), `python`, `react-vite`, `node-graphql`, `terraform`.
   - Write `adapter:` in `sdd.yaml` (or `adapters.stack:`) and `.sdd/stack.json` provenance after confirmation.
2. Ensure folders appropriate to the stack (canonical 11-step layout):
   - Shared: `specs/`, `.sdd/` (premises, canonical, research, runs, evidence, demo, bugs + `_templates`, stack.json, empty `dev-spec.md` / `implementation-plan.md` / `design-approach.md`), `src/` (or module root for Terraform)
   - Test layers: `tests/unit/`, `tests/integration/`, `tests/e2e/` (create even if a stack fills them later)
   - Spec Tests: TS / node-graphql → `tests/features` + `tests/steps` (or `tests/spec` when configured); python → `tests/`; react-vite → e2e (+ unit); terraform → `tests/` for `*.tftest.hcl`
3. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`). Set **stack-specific `runners`** including layer keys when available (`spec`/`cucumber`, `unit`, `integration`, `e2e`/`playwright`, or `all`). Optionally include a commented `ticketing:` section for Linear/Jira.
4. Write `.sdd/premises.md` and `specs/_example.md` from shared templates if missing — **declare Stack explicitly** (adapter id + tech) so detection is demonstrable. Mention the three test layers (unit / integration / e2e) plus Spec Tests.
5. Scaffold via the matching package (`@rogeriobatista/adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, or `adapter-terraform`) or copy from `examples/`.
6. Install the **host adapter** instruction files for this project (Cursor skill/rules, Claude `CLAUDE.md` + `.claude/skills`, or Copilot `.github/copilot-instructions.md` + prompts) — do not overwrite existing human specs.
7. Do **not** overwrite existing human specs.

Report the tree, the chosen `adapter` (and detection `source`), and tell the user: edit `specs/` (the **only human iteration surface** / step 1), or run from-ticket and pause for spec review, then `/sdd run` / `SDD: run` for the **automated steps 2–10** (spec-tests → … → evidence; step 11 = continuous best practices) until all test levels pass.
