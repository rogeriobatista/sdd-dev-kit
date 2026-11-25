---
name: sdd-fix
description: Fix a bug after reproduce (TDD) (SDD: fix)
agent: agent
argument-hint: <bugId>
---
Run **SDD: fix** — only after `reproduce` left a failing regression (`meta.regressionTest`). Loop implement→verify until regression + suite green; update evidence pack for the bug evidenceKey; then QA.

## Debug, QA e bugfix (erros reportados pelo cliente)

Fluxo paralelo ao pipeline canônico 1–11. Use quando o cliente (ou QA) reporta um erro: capturar → reproduzir com teste falhando → diagnosticar → corrigir em loop TDD → sign-off QA → atualizar evidence.

### Intents / comandos

| Intent | Cursor | Claude | Copilot | CLI |
|--------|--------|--------|---------|-----|
| Capturar relatório | `/sdd bug report` | `SDD: bug report` | `SDD: bug report` / `/sdd-bug-report` | `sdd bug-report [id]` |
| Regressão falhando | `/sdd reproduce` | `SDD: reproduce` | `SDD: reproduce` / `/sdd-reproduce` | `sdd reproduce <id>` |
| Diagnóstico guiado | `/sdd debug` | `SDD: debug` | `SDD: debug` / `/sdd-debug` | `sdd debug <id>` |
| Checklist QA | `/sdd qa` | `SDD: qa` | `SDD: qa` / `/sdd-qa` | `sdd qa <id>` |
| Corrigir (após reproduce) | `/sdd fix` | `SDD: fix` | `SDD: fix` / `/sdd-fix` | `sdd fix <id>` |

### Bug id

1. Preferir ticket: `linear:ENG-42` / `jira:SHOP-7` (alinha `evidenceKey` com o sistema de evidence existente).
2. Sem ticket: gerar estável `bug_<uuid>` sob `.sdd/bugs/`.
3. No disco: `:` → `_` (ex.: `.sdd/bugs/linear_ENG-42/`), igual a evidence.

Helpers: `parseBugId`, `resolveBugPaths`, `ensureBugReport`, `encodeBugIdForPath` em `@rogeriobatista/core`.

### Layout de artefatos

```text
.sdd/bugs/<encodedId>/
  REPORT.md     # humano pode refinar (como specs/)
  DEBUG.md      # diagnóstico (agente)
  QA.md         # sign-off QA (agente + humano)
  meta.json     # bugId, evidenceKey, status, regressionTest
```

Templates PT (cliente/QA): `packages/adapter-shared/templates/.sdd/bugs/_templates/{REPORT,DEBUG,QA}.md`.

### Procedimentos

#### bug report

1. Resolver id (`parseBugId` / `ensureBugReport`).
2. Criar `.sdd/bugs/<id>/REPORT.md` + `meta.json` (status `reported`).
3. Se veio de ticket: preencher link Linear/Jira; `evidenceKey` = id do ticket.
4. **Pausar** para o humano enriquecer passos / esperado / atual / severidade / ambiente / anexos (sem secrets).
5. Não inventar passos que o cliente não descreveu.

#### reproduce

1. Ler `REPORT.md`. **Hard rule:** não entrar em `fix` sem regressão vermelha.
2. Preferir Spec Test ou e2e que trave o bug sob `tests/` (feature/scenario ou teste dedicado).
3. Rodar até falhar de forma estável; registrar caminho em `meta.json` → `regressionTest`.
4. Opcional: espelhar cenário em `specs/` só se o humano pedir (specs são human-owned).

#### debug

1. Usar evidence, logs redigidos, testes falhando, e catalog de research/boas práticas na dúvida.
2. Escrever `.sdd/bugs/<id>/DEBUG.md` (hipótese, evidências, causa raiz, próximos passos).
3. Sem secrets; citar fontes de research quando aplicável.

#### qa

1. Preencher `.sdd/bugs/<id>/QA.md`: matriz de regressão, severidade, notas de reteste, checklist.
2. Só marcar aprovado quando a regressão do bug **e** a suite existente passam.
3. Confirmar que `.sdd/evidence/<key>/latest/demo/` foi atualizado após o fix.

#### fix

1. **Pré-condição:** `reproduce` já deixou um teste falhando. Se não, **STOP** → rode `reproduce` primeiro (TDD para bugs).
2. Entrar no loop implement → verify (regressão + suite) até verde ou diagnose cap.
3. Atualizar evidence pack da mesma `evidenceKey` (`updateEvidencePack` / `sdd demo`).
4. Atualizar `meta.json` status; seguir com `qa`.

### Hard rules (bugfix)

- **Nunca** “fix” sem regressão falhando primeiro.
- Human-owned: `REPORT.md` (refinar como specs). Agent-owned: DEBUG/QA/meta, testes de regressão, código.
- Evidence cliente atualizado após fix (`latest/demo`).
- Boas práticas sob incerteza (catalog existente + step 11).
- Sem secrets em REPORT/DEBUG/QA/anexos/argv.

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit generated tests, Dev Spec, implementation plan, design approach, canonical, or production code for the happy path.
- **Human iteration surface (ONLY):** `specs/` (+ clarifying acceptance; optional review that Spec Tests match intent). Steps 2–10 of `/sdd run` are an **automated loop** until all test levels pass or the diagnose cap — do **not** stop mid-loop to ask the human to fix code.
- If failures look like **wrong/ambiguous specs**, exit the auto-loop and ask the human to iterate on `specs/` — the only human gate.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags (default TS/UI stacks): `@api` → API/Cucumber/pytest Spec track; `@ui`/`@e2e` → Playwright when the adapter supports UI.
- Stack adapters are first-class: `typescript` | `python` | `react-vite` | `node-graphql` | `terraform` (alias `ts` → `typescript`).
- **Stack comes from specification docs** (premises → specs → optional stack.json / sdd.yaml fallback). If missing/ambiguous: stop and ask the human — never invent a stack from app source as the primary signal.
- Terraform verify: no cloud apply / no secrets required for default runners.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status / demo / docs / bug-report / reproduce / debug / qa / fix) — not file watch.
- Canonical artifacts: Spec Tests under `tests/features` or `tests/spec`; Dev Spec / Implementation Plan / Design Approach under `.sdd/dev-spec.md`, `.sdd/implementation-plan.md`, `.sdd/design-approach.md`; test layers `tests/unit/`, `tests/integration/`, `tests/e2e/`; evidence under `.sdd/evidence/<key>/latest/`; docs under `docs/sdd/`; client bugs under `.sdd/bugs/<id>/`.
- Evidence packs (`.sdd/evidence/<key>/latest/demo/`) are for PO/BO/QA: Portuguese business language from specs, no code dumps, no secrets, offline-relative paths. Same key updates in place as development progresses. Evidence/demo update is step 10 (after green or after the auto-loop ends with a report). After `/sdd fix`, refresh the pack for that bug/ticket evidence key.
- **Docs (optional after evidence):** `docs` / `/sdd docs` generates `docs/sdd/` from specs + Dev Spec + design + research + evidence (+ bugs when present). Prefer `buildDocs({ projectRoot, mode? })` from `@rogeriobatista/core`. Must **not** invent features absent from specs/premises; mark gaps instead. Subcommands: `changelog`, `api`, `handoff`.
- **Bugfix TDD:** never “fix” client bugs without a failing regression from `/sdd reproduce` first. Human refines `REPORT.md`; agent owns DEBUG/QA/meta, regression tests, and code.
- **Research / best practices (step 11 — continuous):** during steps 2–10 (and during `/sdd debug` when uncertain), open the curated catalog (`best-practices-catalog`) for the detected stack **plus security** whenever there is doubt. Cite sources in Dev Spec / Implementation Plan / Design Approach / DEBUG; do not invent uncited practices. Premises override catalog on conflict (note it). Links + short guidance only — no scraping copyrighted full docs into the repo.
