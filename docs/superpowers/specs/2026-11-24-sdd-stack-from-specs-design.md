# SDD stack from specification docs — Design addendum

**Date:** 2026-11-24  
**Status:** Approved  
**Parent:** [2026-11-24-sdd-stack-adapters-design.md](./2026-11-24-sdd-stack-adapters-design.md)

## Goal

Identify which stack adapter to use (`python`, `react-vite`, `node-graphql`, `terraform`, `typescript`, …) from each project’s **specification documents**, not only a hard-coded `sdd.yaml` `adapter` field.

User requirement: *“A stack do projeto deve ser identificada de acordo com os documentos de especificação de cada projeto.”*

## Authoritative sources (in order)

| Priority | Source | Role |
|----------|--------|------|
| 1 | `.sdd/premises.md` | Explicit `## Stack` (preferred human-readable) |
| 2 | `specs/**/*.md` | Frontmatter `stack:`, `@stack:<id>`, or `## Stack` |
| 3 | `.sdd/stack.json` | Optional machine override / provenance — **not** the only way |
| 4 | `sdd.yaml` `adapter` / `adapters.stack` | Fallback when specs omit stack (**warn** in status) |
| 5 | `package.json` / `pyproject.toml` / `*.tf` | Last-resort weak signal (low confidence; still ask human) |

Do **not** treat application source heuristics as primary.

## Core API (`@sdd-dev-kit/core`)

```ts
detectStack(projectRoot): {
  stack: StackAdapterId | null;
  source: "premises" | "specs" | "stack.json" | "sdd.yaml"
        | "package-manifest" | "ambiguous" | "missing";
  confidence: "high" | "medium" | "low" | "none";
  candidates: StackAdapterId[];
  warnings: string[];
  needsClarification: boolean;
}

writeStackProvenance(projectRoot, result): StackProvenance | null
alignSddYamlAdapter(projectRoot, stack): boolean
normalizeStackId(raw): StackAdapterId | null
scoreStackKeywords(text): { stack, score }[]
```

Synonyms map to canonical schema ids (`pytest` → `python`, `react`/`vite` → `react-vite`, `graphql` → `node-graphql`, `ts` → `typescript`, …).

## Pipeline / host behavior

On **init** / **run** / **from-ticket**:

1. Agent **must** read premises + specs and set/confirm stack **before** materialize/verify.
2. If missing/ambiguous: **STOP** and ask the human to declare stack in `.sdd/premises.md` — **do not invent**.
3. After detection: write `.sdd/stack.json` `{ stack, source, detectedAt }` and align `sdd.yaml` `adapter` when safe.

Status reports adapter id + detection source + fallback warnings.

## Backward compatibility

- Existing projects with only `sdd.yaml` `adapter` keep working (fallback + warning).
- Nested `adapters.stack` still overrides top-level `adapter` inside the YAML parser.
- Examples declare `adapter: <id>` under `## Stack` so detection is demonstrable without relying on yaml alone.

## Non-goals

- Replacing stack adapters or runners
- Inventing business rules from source trees
- Making `package.json` the primary authority
