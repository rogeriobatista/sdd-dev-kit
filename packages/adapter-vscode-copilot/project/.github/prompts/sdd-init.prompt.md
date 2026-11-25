---
name: sdd-init
description: Scaffold the project for Spec-Driven Development (SDD: init)
agent: agent
---
Run **SDD: init** for this workspace.

Follow the Init section of the SDD protocol (shared pipeline instructions). Create folders, `sdd.yaml`, premises, example spec, and ensure Copilot instruction/prompt files from `@rogeriobatista/adapter-vscode-copilot` are present. Do not overwrite existing human specs.

## Init — scaffold the project for SDD

1. **Detect or confirm the stack** from specification docs (see **Stack detection**):
   - Read `.sdd/premises.md` + `specs/**/*.md` first (`detectStack`).
   - If missing/ambiguous: **STOP** and ask the human to declare stack in `.sdd/premises.md` (`## Stack`). Do not invent.
   - Canonical ids: `typescript` (alias `ts`), `python`, `react-vite`, `node-graphql`, `terraform`.
   - Write `adapter:` in `sdd.yaml` (or `adapters.stack:`) and `.sdd/stack.json` provenance after confirmation.
2. Ensure folders appropriate to the stack:
   - Shared: `specs/`, `.sdd/` (premises, canonical, plan, runs, evidence, demo, stack.json), `src/` (or module root for Terraform)
   - TS / node-graphql: `tests/features`, `tests/steps`, and e2e when UI applies
   - python: `tests/`
   - react-vite: `tests/e2e` (+ optional `tests/unit`)
   - terraform: `tests/` for `*.tftest.hcl`
3. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`). Set **stack-specific `runners`** (see adapter README). Optionally include a commented `ticketing:` section for Linear/Jira.
4. Write `.sdd/premises.md` and `specs/_example.md` from shared templates if missing — **declare Stack explicitly** (adapter id + tech) so detection is demonstrable.
5. Scaffold via the matching package (`@rogeriobatista/adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, or `adapter-terraform`) or copy from `examples/`.
6. Install the **host adapter** instruction files for this project (Cursor skill/rules, Claude `CLAUDE.md` + `.claude/skills`, or Copilot `.github/copilot-instructions.md` + prompts) — do not overwrite existing human specs.
7. Do **not** overwrite existing human specs.

Report the tree, the chosen `adapter` (and detection `source`), and tell the user: edit `specs/`, or run from-ticket, then run the full pipeline.
