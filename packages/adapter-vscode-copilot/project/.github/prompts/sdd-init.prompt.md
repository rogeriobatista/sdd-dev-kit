---
name: sdd-init
description: Scaffold the project for Spec-Driven Development (SDD: init)
agent: agent
---
Run **SDD: init** for this workspace.

Follow the Init section of the SDD protocol (shared pipeline instructions). Create folders, `sdd.yaml`, premises, example spec, and ensure Copilot instruction/prompt files from `@sdd-dev-kit/adapter-vscode-copilot` are present. Do not overwrite existing human specs.

## Init — scaffold the project for SDD

1. **Choose the stack adapter** (ask if unclear): `typescript` (alias `ts`), `python`, `react-vite`, `node-graphql`, or `terraform`. Write it as `adapter:` in `sdd.yaml` (or `adapters.stack:`).
2. Ensure folders appropriate to the stack:
   - Shared: `specs/`, `.sdd/` (premises, canonical, plan, runs), `src/` (or module root for Terraform)
   - TS / node-graphql: `tests/features`, `tests/steps`, and e2e when UI applies
   - python: `tests/`
   - react-vite: `tests/e2e` (+ optional `tests/unit`)
   - terraform: `tests/` for `*.tftest.hcl`
3. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`). Set **stack-specific `runners`** (see adapter README). Optionally include a commented `ticketing:` section for Linear/Jira.
4. Write `.sdd/premises.md` and `specs/_example.md` from shared templates if missing — adjust Stack/Tags for the chosen adapter.
5. Scaffold via the matching package (`@sdd-dev-kit/adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, or `adapter-terraform`) or copy from `examples/`.
6. Install the **host adapter** instruction files for this project (Cursor skill/rules, Claude `CLAUDE.md` + `.claude/skills`, or Copilot `.github/copilot-instructions.md` + prompts) — do not overwrite existing human specs.
7. Do **not** overwrite existing human specs.

Report the tree, the chosen `adapter`, and tell the user: edit `specs/`, or run from-ticket, then run the full pipeline.
