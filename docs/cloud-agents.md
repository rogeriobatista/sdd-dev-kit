# Cloud Agents (Cursor) — SDD Dev Kit

Use the published CLI so Cursor Cloud Agents (Mac/PC workers or cloud VMs) can scaffold and verify SDD projects without cloning this monorepo.

## Install

Default registry is **GitHub Packages** for scope `@sdd-dev-kit`.

### Auth

1. Create a GitHub PAT with `read:packages` (and `write:packages` only if publishing).
2. Configure npm (agent environment secret or install step):

```bash
# .npmrc (never commit the token value)
@sdd-dev-kit:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

3. Expose the token as an environment secret named `GITHUB_TOKEN` or `NODE_AUTH_TOKEN`.

### Global or npx

```bash
npm i -g @sdd-dev-kit/cli
sdd init --host cursor --stack typescript

# or one-shot
npx @sdd-dev-kit/cli init --host cursor --stack typescript
```

From a local clone of this repo (dev):

```bash
npm run setup
npm run build -w @sdd-dev-kit/cli
npx sdd init --cwd /path/to/app --stack typescript
```

## Environment secrets (optional)

| Secret / env | Used by | Notes |
|--------------|---------|--------|
| `GITHUB_TOKEN` / `NODE_AUTH_TOKEN` | npm install from GitHub Packages | `read:packages`; never commit |
| `LINEAR_API_KEY` | `sdd from-ticket` | Linear GraphQL |
| `JIRA_BASE_URL` | `sdd from-ticket` | e.g. `https://your-domain.atlassian.net` |
| `JIRA_API_TOKEN` | `sdd from-ticket` | API token |
| `JIRA_EMAIL` | `sdd from-ticket` | Cloud basic auth; omit to send Bearer |

Configure **names only** under `ticketing:` in `sdd.yaml`. Never put secrets on argv or in the repo.

## Suggested Cloud Agent install snippet

```bash
npm config set @sdd-dev-kit:registry https://npm.pkg.github.com
npm i -g @sdd-dev-kit/cli
sdd status || sdd init --host cursor
```

Heavy LLM phases (`normalize` → `implement`) stay host-driven (`/sdd run`). The CLI covers `init`, `from-ticket`, `verify`, `demo`, and `status`.

## Publish (maintainers)

Tag `v*` or run workflow **Publish packages** (`.github/workflows/publish.yml`).

Repo secret `NODE_AUTH_TOKEN` (PAT with `write:packages`) is preferred when `GITHUB_TOKEN` cannot publish under the `@sdd-dev-kit` scope. See `.npmrc.example`.
