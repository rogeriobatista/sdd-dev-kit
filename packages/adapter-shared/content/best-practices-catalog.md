# SDD best-practices catalog

**catalogVersion:** `1`  
**Purpose:** Curated, short list of **official / standards** references the agent must open during `research` (and before `plan` / `implement`). Prefer these URLs over random blogs. Do **not** scrape or paste copyrighted full docs into the repo — links + short applied guidance only.

**Always include:** the **Security** section for every stack, plus the domain section(s) that match the detected stack.

| Stack id | Domains to open |
|----------|-----------------|
| `react-vite` | Frontend + Security |
| `typescript` / `ts` | Backend (TS) + Frontend (if `@ui`/`@e2e`) + Security |
| `node-graphql` | Backend (Node/GraphQL) + Security |
| `python` | Backend (Python) + Security |
| `terraform` | Infra + Security |

---

## Frontend

Stacks: `react-vite`; also `typescript` when UI/E2E tags apply.

| Id | Title | URL | Apply when |
|----|-------|-----|------------|
| `fe-react-docs` | React docs (Thinking in React / hooks) | https://react.dev/learn | Component structure, state, effects |
| `fe-vite` | Vite guide | https://vite.dev/guide/ | Build, env, asset handling |
| `fe-playwright` | Playwright best practices | https://playwright.dev/docs/best-practices | Locators, isolation, web-first assertions |
| `fe-a11y` | WAI-ARIA Authoring Practices | https://www.w3.org/WAI/ARIA/apg/ | Keyboard, roles, labels |
| `fe-webdev` | web.dev (performance / a11y / patterns) | https://web.dev/ | Core UX quality baselines |

**Short guidance:** Prefer accessible names and roles; Playwright: role/label locators over CSS; keep Vite env via `import.meta.env` without leaking secrets to the client.

---

## Backend

Stacks: `typescript`, `node-graphql`, `python`.

| Id | Title | URL | Apply when |
|----|-------|-----|------------|
| `be-ts-handbook` | TypeScript Handbook | https://www.typescriptlang.org/docs/handbook/intro.html | Types, modules, strictness |
| `be-node` | Node.js best practices (official docs) | https://nodejs.org/en/learn/getting-started/introduction-to-nodejs | Runtime, modules, errors |
| `be-graphql` | GraphQL best practices (GraphQL Foundation) | https://graphql.org/learn/best-practices/ | Schema design, nullability, pagination |
| `be-pytest` | pytest good practices | https://docs.pytest.org/en/stable/explanation/goodpractices.html | Fixtures, layout, parametrize |
| `be-12factor` | The Twelve-Factor App | https://12factor.net/ | Config, processes, backing services, logs |

**Short guidance:** Config via environment (12-factor); strict TypeScript where the stack is TS; GraphQL: explicit nullability and pagination; pytest: package layout + fixtures over global state.

---

## Infra

Stacks: `terraform`.

| Id | Title | URL | Apply when |
|----|-------|-----|------------|
| `infra-tf-style` | HashiCorp Terraform style guide / configuration language | https://developer.hashicorp.com/terraform/language/style | Naming, structure, readability |
| `infra-tf-test` | Terraform test | https://developer.hashicorp.com/terraform/language/tests | `*.tftest.hcl`, assertions |
| `infra-tf-modules` | Modules overview | https://developer.hashicorp.com/terraform/language/modules | Boundaries, inputs/outputs |

**Short guidance:** No cloud apply in default SDD verify; prefer `fmt` / `validate` / `terraform test`. High-level CIS themes (least privilege, encryption at rest/in transit) — link only, do not scrape paywalled CIS PDFs.

---

## Security (all stacks)

| Id | Title | URL | Apply when |
|----|-------|-----|------------|
| `sec-owasp-top10` | OWASP Top 10 | https://owasp.org/www-project-top-ten/ | Threat baseline for apps/APIs |
| `sec-asvs` | OWASP ASVS (cheat sheet / project) | https://owasp.org/www-project-application-security-verification-standard/ | Verification themes |
| `sec-secrets` | OWASP Secrets Management Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html | Tokens, env, never commit secrets |
| `sec-deps` | OWASP Dependency-Check / supply chain hygiene | https://owasp.org/www-project-dependency-check/ | Dependency review mindset |

**Short guidance:** Never put secrets on argv or in repo files; scrub tokens from logs/evidence; validate input at trust boundaries; keep dependencies current; Terraform: no credentials required for default runners.

---

## Agent rules for this catalog

1. Open the matching domain sections for the detected stack **plus Security**.
2. Prefer MCP **WebSearch** / fetch of the official URLs above when available; otherwise cite catalog URLs from memory of this file.
3. Record applied decisions in `.sdd/research/<encodedEvidenceKey>/BEST_PRACTICES.md` and machine list in `sources.json`.
4. Every plan task that claims a “best practice” **must cite** a source id/URL from this catalog (or a premises override).
5. If a practice **conflicts** with `.sdd/premises.md`, **premises win** — note the conflict in `BEST_PRACTICES.md`.
6. Do not invent uncited “market best practices.” Do not paste large copyrighted excerpts.
