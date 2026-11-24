## Init — scaffold the project for SDD

1. Ensure folders: `specs/`, `.sdd/` (premises, canonical, plan, runs), `tests/features`, `tests/steps`, `tests/e2e`, `src/`.
2. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`, adapter `typescript`). Optionally include a commented `ticketing:` section for Linear/Jira.
3. Write `.sdd/premises.md` and `specs/_example.md` from shared templates if missing.
4. Add Cucumber + Playwright configs and npm scripts via `@sdd-dev-kit/adapter-ts` scaffold (or copy equivalent files from the kit example).
5. Install the **host adapter** instruction files for this project (Cursor skill/rules, Claude `CLAUDE.md` + `.claude/skills`, or Copilot `.github/copilot-instructions.md` + prompts) — do not overwrite existing human specs.
6. Do **not** overwrite existing human specs.

Report the tree and tell the user: edit `specs/`, or run from-ticket, then run the full pipeline.
