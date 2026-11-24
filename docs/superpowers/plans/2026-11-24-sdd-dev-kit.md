# SDD Dev Kit — Implementation Plan

> **For agentic workers:** Execute task-by-task. Design is approved in `docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md`.

**Goal:** Ship Protocol Kit MVP — core + Cursor adapter + TS adapter (Cucumber + Playwright) + `examples/coupon-checkout`.

**Tech stack:** TypeScript monorepo, Zod, `@cucumber/cucumber`, Playwright, Cursor skills/rules/templates.

## Global constraints

- Human edits only `specs/` and optionally `.sdd/premises.md`
- Generated artifacts regenerable
- Pipeline never invents business rules
- Trigger: `/sdd run`; `triggers.watch` default `false`
- Max 3 diagnose→implement iterations
- Specs in Portuguese (`Dado`/`Quando`/`Então`/`E`)
- Tags: `@api` → Cucumber; `@ui`/`@e2e` → Playwright
- No standalone CLI or watch implementation in MVP

---

### Task 1: Monorepo scaffold

**Files:**
- Create `package.json` (workspaces: `packages/*`, `examples/*`)
- Create `tsconfig.base.json`, root `tsconfig.json`
- Create `.gitignore`, `README.md`
- Create empty package stubs: `packages/core`, `packages/adapter-ts`, `packages/adapter-cursor`

**Done when:** `npm install` at root succeeds; packages resolve as workspaces.

---

### Task 2: `packages/core`

**Files:**
- `packages/core/package.json` — name `@sdd-dev-kit/core`
- `packages/core/src/schema.ts` — Zod schema for `sdd.yaml`
- `packages/core/src/types.ts` — canonical scenario, plan task, run report, phase status
- `packages/core/src/paths.ts` — canonical folder constants + helpers
- `packages/core/src/phases.ts` — phase names + loop caps
- `packages/core/src/index.ts` — public exports
- `packages/core/src/schema.test.ts` — unit tests (valid + invalid manifest)

**Schema fields (minimum):**
- `version`
- `adapter` (`typescript` | future)
- `paths` (`specs`, `premises`, `canonical`, `plan`, `runs`, `features`, `steps`, `e2e`, `src`)
- `runners` (`cucumber`, `playwright`, `all`)
- `triggers` (`watch` boolean default false, `command` default `/sdd run`)
- `loop` (`maxDiagnoseIterations` default 3)

**Done when:** unit tests pass for valid default manifest and reject invalid ones.

---

### Task 3: `packages/adapter-ts`

**Files:**
- `packages/adapter-ts/package.json` — `@sdd-dev-kit/adapter-ts`, deps cucumber + playwright + core
- `packages/adapter-ts/src/scaffold.ts` — write project template (configs, folders, scripts)
- `packages/adapter-ts/src/materialize.ts` — canonical → `.feature` + step stubs + Playwright specs by tag
- `packages/adapter-ts/src/runners.ts` — spawn cucumber / playwright / all
- `packages/adapter-ts/src/index.ts`
- `packages/adapter-ts/templates/` — cucumber.js, playwright.config.ts, sample smoke fixtures

**Done when:** scaffold creates expected tree; materialize maps tags correctly; runners invoke tools.

---

### Task 4: `packages/adapter-cursor`

**Files:**
- `packages/adapter-cursor/skills/sdd/SKILL.md` — `/sdd` with `init | run | verify | status`
- `packages/adapter-cursor/rules/sdd-human-edits.mdc` — human-only specs/premises
- `packages/adapter-cursor/templates/sdd.yaml`
- `packages/adapter-cursor/templates/specs/_example.md`
- `packages/adapter-cursor/templates/.sdd/premises.md`
- `packages/adapter-cursor/README.md` — how to install into a Cursor project

**Done when:** skill documents full pipeline phases; rules enforce edit boundaries; templates match core defaults.

---

### Task 5: Example `examples/coupon-checkout`

**Files:**
- App domain: coupon apply (valid / expired)
- Minimal UI for Playwright
- `specs/checkout-cupom.md` — NL scenarios in PT
- `.sdd/premises.md`, `sdd.yaml`
- Scaffolded `tests/` with smoke fixtures
- `README.md` — edit specs only, run `/sdd run`

**Done when:** tree matches design; specs use Dado/Quando/Então; tags route correctly.

---

### Task 6: Smoke + README

- Run core tests
- Smoke cucumber + playwright in example (green minimal fixtures)
- Root README: vision, quickstart (`/sdd init`, `/sdd run`), roadmap (CLI, watch, other adapters, Vitest)

**Done when:** smoke commands succeed; README documents human flow and out-of-MVP items.
