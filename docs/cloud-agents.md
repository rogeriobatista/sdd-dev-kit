# Cloud Agents (Cursor) — SDD Dev Kit

Use the published CLI so Cursor Cloud Agents (Mac/PC workers or cloud VMs) can scaffold and verify SDD projects without cloning this monorepo.

## Install

To **download** `@rogeriobatista/*` from **GitHub Packages** you **must** configure registry + auth. Without both, `npm i` / `npx` fails with **404** (scope not resolved on npmjs) or **401** (private package, no token).

### Auth (required for Packages)

1. Create a GitHub PAT with at least `read:packages` (add `write:packages` only if publishing).
2. Configure npm (agent environment secret or install step) — both lines are mandatory:

```ini
# .npmrc (never commit the token value — use ${GITHUB_TOKEN})
@rogeriobatista:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

| Line | Role |
|------|------|
| `@rogeriobatista:registry=…` | Resolve the `@rogeriobatista` scope on GitHub Packages |
| `//npm.pkg.github.com/:_authToken=…` | Authenticate private package downloads (`read:packages`) |

3. Expose the token as an environment secret named `GITHUB_TOKEN` or `NODE_AUTH_TOKEN`.

See `.npmrc.example` in the repo root.

### Global or npx (after registry + token)

```bash
npm i -g @rogeriobatista/cli
sdd init --host cursor --stack typescript

# or one-shot
npx @rogeriobatista/cli init --host cursor --stack typescript
```

### Alternative: clone (no Packages)

If you cannot use GitHub Packages, clone this repo and run locally — no registry token needed:

```bash
npm run setup
npm run build -w @rogeriobatista/cli
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
# Requires GITHUB_TOKEN (or NODE_AUTH_TOKEN) in the environment with read:packages
# Prefer copying .npmrc.example → ~/.npmrc (both registry + _authToken lines)
npm config set @rogeriobatista:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken "${GITHUB_TOKEN}"
npm i -g @rogeriobatista/cli
sdd status || sdd init --host cursor
```

Omit Packages entirely by cloning the monorepo and using `npm run setup` + local `npx sdd` (see Alternative above).

Heavy LLM phases (`normalize` → `implement`) stay host-driven (`/sdd run`). The CLI covers `init`, `from-ticket`, `verify`, `demo`, and `status`.

## Publish (maintainers)

Tag `v*` or run workflow **Publish packages** (`.github/workflows/publish.yml`).

Repo secret `NODE_AUTH_TOKEN` (PAT with `write:packages`) is preferred when `GITHUB_TOKEN` cannot publish under the `@rogeriobatista` scope. See `.npmrc.example`.
