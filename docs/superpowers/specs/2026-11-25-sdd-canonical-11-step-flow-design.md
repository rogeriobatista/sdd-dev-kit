# SDD canonical 11-step flow — Design

**Date:** 2026-11-25  
**Status:** Approved  
**Parent:** [2026-11-24-sdd-dev-kit-design.md](./2026-11-24-sdd-dev-kit-design.md)  
**Related:** [spec iteration + auto-loop](./2026-11-25-sdd-spec-iteration-auto-loop-design.md) · [best-practices research](./2026-11-25-sdd-best-practices-research-design.md)

## Goal

Lock the kit’s development flow to the user’s **exactly numbered 11 steps**, with stable artifact paths, host skills, CLI help, and core phase constants aligned.

## Canonical flow (LOCKED)

| Step | Actor | Action | Artifact |
|------|-------|--------|----------|
| 1 | Human | NL mixed with BDD in `specs/` | `specs/` |
| 2 | Kit | Executable Spec Tests | `tests/spec/` or `tests/features/` |
| 3 | Kit | Dev Spec | `.sdd/dev-spec.md` |
| 4 | Kit | Dev Implementation Plan | `.sdd/implementation-plan.md` |
| 5 | Kit | Design & Approach | `.sdd/design-approach.md` |
| 6 | Kit | Unit tests | `tests/unit/` |
| 7 | Kit | Integration tests | `tests/integration/` |
| 8 | Kit | E2E tests | `tests/e2e/` |
| 9 | Kit | Implement + verify all levels until green | `src/` + `.sdd/runs/` |
| 10 | Kit | Evidence for requester | `.sdd/evidence/<key>/latest/` |
| 11 | Kit | Continuous market best practices | `.sdd/research/<key>/` |

### Human vs auto

- **Step 1** is the only human iteration gate (plus return-to-specs if requirements are ambiguous).
- **Steps 2–10** run automatically in `/sdd run` / `sdd run` after specs are accepted.
- **Step 11** is continuous policy during 2–10 (catalog + research pack); premises win on conflict. Not a separate stop.

## Core phase model

| Constant | Role |
|----------|------|
| `SPECS_PHASE` / `HUMAN_ITERATIVE_PHASES` | Step 1 (+ from-ticket bootstrap) |
| `PHASES` / `AUTO_LOOP_PHASES` | `spec-tests` → `dev-spec` → `implementation-plan` → `design-approach` → `unit-tests` → `integration-tests` → `e2e-tests` → `implement` → `verify` → `diagnose` → `evidence` |
| `CANONICAL_FLOW_STEPS` | Full steps 1–11 with actor + artifact for CLI/docs |
| `RESEARCH_PHASE` | Step 11 continuous / standalone `/sdd research` |
| `DEMO_PHASE` | Stakeholder view of step 10 evidence |

## Paths & runners

- Schema/paths: `devSpec`, `implementationPlan`, `designApproach`, `spec`, `unit`, `integration`, `e2e` (+ existing `features`).
- Verify may run layer keys from `sdd.yaml`: `spec`, `unit`, `integration`, `e2e`, or stack aliases (`cucumber`, `playwright`, …) and `all`.

## Host sync

- Shared: `pipeline.md`, `hard-rules.md`, `human-boundary.md`, `init.md`, `research.md`, templates via `npm run sync:adapters`.
- CLI `sdd run --help` lists steps 1–10 (and notes step 11 continuous).
- Cursor / Claude / Copilot skills and prompts re-rendered from shared content.

## Out of scope

- Rewriting every example app for smoke (folder/premises hints only)
- Enabling file watch as default trigger
- Asking humans to green the suite by editing generated tests or production code
