# SDD demo from test evidence — Design

**Date:** 2026-11-24  
**Status:** Approved  
**Parent:** [2026-11-24-sdd-dev-kit-design.md](./2026-11-24-sdd-dev-kit-design.md)

## Goal

After verify, produce a **presentable demo pack** from test-run evidence so a **PO / BO / QA** can review feature intent and outcomes without opening the IDE.

User ask: *“Quero também que consiga criar uma demo a partir das evidencias dos testes para poder apresentar a um PO/BO/QA.”*

## Command / phase

| Host | Invoke |
|------|--------|
| Cursor | `/sdd demo` (optional `<runId>`) |
| Claude | `SDD: demo` |
| Copilot | `SDD: demo` / `/sdd-demo` |

`demo` is an explicit post-verify command (also listed in `ALL_PHASES` as `DEMO_PHASE`). It is **not** part of the automatic `/sdd run` loop; report may remind the human to run it.

## Inputs

| Source | Role |
|--------|------|
| `.sdd/runs/<id>/` | Latest or named run; `report.json` / `run.json` |
| Playwright | `playwright-report/`, `reports/playwright.json`, `test-results/**` (shots/videos/traces) |
| Cucumber | `reports/cucumber.json` (+ optional HTML) |
| pytest | `reports/junit.xml` (+ optional HTML) |
| Vitest | `reports/vitest.json` |
| Terraform | `reports/terraform-test.log` or under the run folder |
| Canonical + NL specs | Business wording (intention, Dado/Quando/Então) |

Missing evidence is **graceful** — still emit narrative from run report + specs.

## Output

`.sdd/demo/<runId>/` (agent-owned):

| File | Role |
|------|------|
| `index.html` | Offline-friendly Portuguese narrative page |
| `SUMMARY.md` | Same story for Slack/email |
| `manifest.json` | Machine-readable evidence list |
| `evidence/` | Copied artifacts (portable pack; relative links) |

## Core API

```ts
buildDemo({
  projectRoot: string;
  runId?: string;
  copyEvidence?: boolean; // default true
  locale?: "pt-BR" | "en";  // default pt-BR
}): BuildDemoResult
```

Also exported: `collectEvidence`, `EVIDENCE_CANDIDATES`, parsers for cucumber/junit/playwright, `scrubSecrets`.

## Constraints

- Portuguese stakeholder copy by default
- No secrets in demo output (scrub tokens/keys)
- Offline-friendly relative paths
- No code dumps — business language from specs
- Map scenario ids/titles from canonical/specs → results when possible

## Adapter hooks

Each stack adapter README documents where verify should write evidence. Examples (`coupon-checkout`, `react-vite-playwright`, `python-pytest-hello`, `node-graphql-api`) configure reporters so a demo can be generated after verify.

## Host instructions

Shared content: `packages/adapter-shared/content/demo.md` — rendered into Cursor / Claude / Copilot packs via `npm run sync:adapters`.
