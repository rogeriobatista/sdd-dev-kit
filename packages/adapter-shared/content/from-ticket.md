## From-ticket — bootstrap NL specs from Linear or Jira

Bootstrap NL specs from a **Linear** or **Jira** ticket, then optionally continue with the full pipeline.

### Usage (host-agnostic intents)

- `from-ticket ENG-123` — auto-detect when possible; for ambiguous `KEY-123` use `sdd.yaml` `ticketing.defaultProvider` or a prefix
- `from-ticket linear:ENG-123` or `from-ticket jira:SHOP-7`
- `from-ticket ENG-123 --run` — after writing the draft, continue with the full pipeline run

### Steps

0. **Confirm stack** via stack detection (premises + specs) before or as part of continuing into `--run`. If stack is missing/ambiguous, STOP and ask the human to declare it in `.sdd/premises.md` before materialize/verify.
1. Read `sdd.yaml` `ticketing` (provider configs = **env var names only**, never secrets on argv).
2. Resolve provider:
   - UUID → Linear
   - `linear:` / `jira:` prefix → that provider
   - Ambiguous `KEY-123` → `ticketing.defaultProvider`, else ask the human
3. Fetch via `@rogeriobatista/core` (`fromTicket` / `LinearProvider` / `JiraProvider`):
   - Linear: `LINEAR_API_KEY` (GraphQL)
   - Jira: `JIRA_BASE_URL` + `JIRA_API_TOKEN` (+ `JIRA_EMAIL` for Cloud basic auth; Bearer if email unset)
4. Map title/description/acceptance criteria/labels → Portuguese NL draft (`## Intenção` + `## Cenários` with `Dado`/`Quando`/`Então`).
5. Write `specs/<id>-<slug>.md` and provenance `.sdd/ticket.json`.
6. **Default:** stop and ask the human to review/edit `specs/` (enrich weak AC). **With `--run`:** continue into the full pipeline.

### Hard rules for from-ticket

- Do **not** invent acceptance criteria or business rules that are not in the ticket.
- If the ticket lacks testable scenarios, ask the human to enrich `specs/` before run — do not fabricate GWT.
- Never print API tokens or put secrets on the command line; use environment variables only.
- Prefer the core helpers (`fromTicket`, providers) over ad-hoc HTTP when available in the workspace.

### Ticketing access by host

- **Cursor / Claude:** prefer MCP Linear/Jira tools when configured; otherwise use core REST/GraphQL providers with env vars.
- **GitHub Copilot (VS Code):** MCP may be unavailable or limited — use `@rogeriobatista/core` providers / REST with env vars (`LINEAR_API_KEY`, `JIRA_*`). Document env setup; never put secrets in chat or repo files.
