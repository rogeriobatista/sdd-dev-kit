# SDD spec-iteration + auto-loop — Design

**Date:** 2026-11-25  
**Status:** Approved  
**Parent:** [2026-11-24-sdd-dev-kit-design.md](./2026-11-24-sdd-dev-kit-design.md)

## Goal

Reshape the SDD pipeline so **human iterations happen only at spec (spec-test) creation**, and every subsequent phase runs in an **automated loop until executable spec tests pass** (or the existing diagnose cap).

User ask: *“Eu quero que as iterações sejam feitas no step de criação dos testes de spec. Todos os outros passos devem seguir em um loop até os spec testes passarem.”*

## Semantics

### Human iteration surface (ONLY)

- Create/adjust NL scenarios in `specs/` (+ clarify acceptance).
- Optional review that generated executable tests match intent — if not, fix `specs/` and re-materialize; **never** hand-patch generated tests or production code to green.
- `.sdd/premises.md` when changing project rules (stack, tags, style).

### Automated loop (`/sdd run` / `SDD: run`)

After specs are accepted/written:

```text
                  ┌──────────────────────────────────────────────┐
                  │           HUMAN GATE (iterate here)          │
                  │  specs/  (+ from-ticket draft → pause)       │
                  └──────────────────────┬───────────────────────┘
                                         │ accepted
                                         ▼
detect stack → normalize → executable → research → plan → implement → verify
                                                                      │
                                                    pass ─────────────┼──► report → demo/evidence
                                                    fail              │
                                                         diagnose ────┘
                                                         (→ implement)*
                                                         until green
                                                         or maxDiagnoseIterations
```

| Rule | Behavior |
|------|----------|
| Mid-loop human | **Forbidden** for code / generated tests / plan / canonical |
| Spec gap | Exit loop; ask human to edit `specs/` (only human gate) |
| Cap exceeded | Write run report; if failures look like requirement gaps → point to `specs/`; else report remaining test failures |
| Demo / evidence | After green **or** after loop ends with a report — not mid-loop |

### from-ticket

```text
from-ticket → draft specs/ → pause for human spec iteration
                           → (--run and specs complete) → enter auto-loop
```

## Core phase model

| Constant | Role |
|----------|------|
| `SPECS_PHASE` (`specs`) | Human-iterative |
| `HUMAN_ITERATIVE_PHASES` | `specs`, `from-ticket` |
| `PHASES` / `AUTO_LOOP_PHASES` | normalize → … → report (auto-loop body) |
| `DEFAULT_MAX_DIAGNOSE_ITERATIONS` | Cap (default 3) |

## Host sync

- Shared content: `pipeline.md`, `hard-rules.md`, `human-boundary.md`, `from-ticket.md`, `init.md` via `npm run sync:adapters`.
- CLI `sdd run` / `sdd run --help`: same semantics.
- Cursor / Claude / Copilot skills and prompts re-rendered from shared content.

## Out of scope

- Enabling file watch as default trigger
- Asking humans to green the suite by editing generated tests or production code
