# SDD Ticketing — Design addendum

**Date:** 2026-11-24  
**Status:** Approved (Option C)  
**Parent:** [2026-11-24-sdd-dev-kit-design.md](./2026-11-24-sdd-dev-kit-design.md)

## Goal

Bootstrap `specs/*.md` from a **Linear** or **Jira** ticket, then reuse the existing `/sdd run` pipeline (normalize → executable → plan → implement → verify).

## Locked decision

| Topic | Choice |
|-------|--------|
| Providers in MVP | **Both** Linear and Jira |
| UX | Common interface `/sdd from-ticket <id>` |
| Human surface | Still primarily `specs/`; ticket import is bootstrap only |
| Secrets | Env vars only (names in `sdd.yaml`, values never in repo/argv) |

## Contract

### `sdd.yaml` — optional `ticketing`

```yaml
ticketing:
  defaultProvider: linear   # or jira — used when KEY-123 is ambiguous
  providers:
    linear:
      enabled: true
      apiKeyEnv: LINEAR_API_KEY
      defaultTeam: ENG
      fieldMapping:
        acceptanceCriteria: description
    jira:
      enabled: true
      baseUrlEnv: JIRA_BASE_URL
      emailEnv: JIRA_EMAIL
      apiTokenEnv: JIRA_API_TOKEN
      defaultProject: SHOP
      fieldMapping:
        acceptanceCriteria: customfield_10000
```

### Types

- `TicketRef` — `{ id, provider? }`
- `TicketPayload` — `{ id, url, title, description, acceptanceCriteria[], labels[], provider }`
- `TicketProvenance` — written to `.sdd/ticket.json`

### Provider interface

```ts
interface TicketProvider {
  readonly name: "linear" | "jira";
  fetch(ref: TicketRef): Promise<TicketPayload>;
}
```

Implemented in `@sdd-dev-kit/core` (`LinearProvider`, `JiraProvider`) with injectable `fetch` for tests.

### ID resolution

| Input | Provider |
|-------|----------|
| UUID | Linear |
| `linear:ENG-123` / `jira:SHOP-7` | Explicit |
| `ENG-123` | `ticketing.defaultProvider`, else ask human |

### Phase / subcommand

`from-ticket` is a **bootstrap** phase (not part of the default `/sdd run` order):

1. Fetch ticket  
2. Map → Portuguese NL draft (`prosa` + `Dado`/`Quando`/`Então`)  
3. Write `specs/<id>-<slug>.md` + `.sdd/ticket.json`  
4. Stop for human review **or** chain into `run` when `--run` is passed  

Template mapping does **not** invent AC. LLM enrichment (if any) happens in the Cursor skill after the human can edit specs.

## Auth env vars

| Provider | Variables |
|----------|-----------|
| Linear | `LINEAR_API_KEY` |
| Jira | `JIRA_BASE_URL`, `JIRA_API_TOKEN`, and `JIRA_EMAIL` (Cloud basic auth). If email is unset, token is sent as `Bearer` (PAT-style). |

## Offline fixtures

`packages/core/src/ticketing/fixtures/linear-issue.json` and `jira-issue.json` model a fictional “Checkout — aplicar cupom” ticket aligned with `examples/coupon-checkout`, for unit tests without live APIs.

## Out of scope

- CLI watch / polling tickets  
- Writing back status to Linear/Jira  
- Hardcoded secrets or tokens on argv  
