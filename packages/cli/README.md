# `@rogeriobatista/cli`

CLI for the SDD Protocol Kit (`sdd`).

## Install

GitHub Packages (default):

```bash
# ~/.npmrc or project .npmrc
@rogeriobatista:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}

npm i -g @rogeriobatista/cli
# or
npx @rogeriobatista/cli init
```

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
