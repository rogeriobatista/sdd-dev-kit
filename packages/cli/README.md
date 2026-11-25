# `@rogeriobatista/cli`

CLI for the SDD Protocol Kit (`sdd`).

## Install

To **download** from GitHub Packages you **must** set both lines (see root `.npmrc.example`). Registry resolves the `@rogeriobatista` scope; token (`read:packages` min) authenticates private packages. Without them, `npm i` / `npx` fails with **404** / **401**.

```ini
# ~/.npmrc or project .npmrc — never commit a real token
@rogeriobatista:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm i -g @rogeriobatista/cli
# or
npx @rogeriobatista/cli init
```

**Alternative:** clone the monorepo and use `npm run setup` + local `npx sdd` (no Packages auth).

## Commands

| Command | Purpose |
|---------|---------|
| `sdd init [--host cursor\|claude\|copilot\|all] [--stack <id>]` | Host adapters + `sdd.yaml` + premises + stack scaffold |
| `sdd from-ticket <id> [--run]` | Bootstrap `specs/` from Linear/Jira (env vars) |
| `sdd run` | Status + pipeline guidance (LLM phases stay host-driven) |
| `sdd verify [runner]` | Run `sdd.yaml` runners via core |
| `sdd demo [runId] [--id <key>]` | Stakeholder evidence pack |
| `sdd status` | Last run / stack / ticket / evidence |

See the root README and `docs/cloud-agents.md`.
