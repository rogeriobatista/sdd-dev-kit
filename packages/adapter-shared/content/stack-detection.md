## Stack detection (from specification docs)

The stack adapter is identified from **specification documents**, not by inventing from application source heuristics as the primary signal.

### Authoritative order

1. **`.sdd/premises.md`** — `## Stack` section (preferred). Keywords/synonyms map to canonical ids (`python`/`pytest` → `python`, `react`/`vite` → `react-vite`, `graphql` → `node-graphql`, `terraform` → `terraform`, `typescript`/`ts` → `typescript`).
2. **`specs/**/*.md`** — YAML frontmatter `stack: <id>`, `@stack:<id>` tags, or a `## Stack` section.
3. **`.sdd/stack.json`** — optional machine-readable override / prior provenance (`{ stack, source, detectedAt }`). Not the only way to set stack.
4. **`sdd.yaml`** `adapter` / `adapters.stack` — **fallback** when premises/specs omit stack (**warn** in status).
5. **Last resort (weak):** `package.json` / `pyproject.toml` / `*.tf` — low confidence; still ask the human to declare stack in premises.

Use `@sdd-dev-kit/core` `detectStack(projectRoot)` → `{ stack, source, confidence, candidates, warnings, needsClarification }`.

### On init / run / from-ticket

1. **Read** premises + specs and call `detectStack` (or equivalent) **before** materialize/verify.
2. If stack is **missing or ambiguous** (`needsClarification`): **STOP**. Ask the human to declare a single stack in `.sdd/premises.md` under `## Stack`. **Do not invent** a stack.
3. After a clear detection: write/update `.sdd/stack.json` provenance via `writeStackProvenance`, and align `sdd.yaml` `adapter` with `alignSddYamlAdapter` when safe.
4. Status must report the resolved `adapter`, detection `source`, and any fallback warnings.
