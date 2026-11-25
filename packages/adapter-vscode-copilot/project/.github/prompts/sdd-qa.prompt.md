---
name: sdd-qa
description: QA checklist / sign-off for a bug (SDD: qa)
agent: agent
argument-hint: <bugId>
---
Run **SDD: qa** — fill `.sdd/bugs/<id>/QA.md` (regression matrix, severity, retest notes). Approve only when bug regression and existing suite pass; confirm evidence/demo latest updated.

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
