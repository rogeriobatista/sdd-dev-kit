## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit generated tests, Dev Spec, implementation plan, design approach, canonical, or production code for the happy path.
- **Human iteration surface (ONLY):** `specs/` (+ clarifying acceptance; optional review that Spec Tests match intent). Steps 2–10 of `/sdd run` are an **automated loop** until all test levels pass or the diagnose cap — do **not** stop mid-loop to ask the human to fix code.
- If failures look like **wrong/ambiguous specs**, exit the auto-loop and ask the human to iterate on `specs/` — the only human gate.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags (default TS/UI stacks): `@api` → API/Cucumber/pytest Spec track; `@ui`/`@e2e` → Playwright when the adapter supports UI.
- Stack adapters are first-class: `typescript` | `python` | `react-vite` | `node-graphql` | `terraform` (alias `ts` → `typescript`).
- **Stack comes from specification docs** (premises → specs → optional stack.json / sdd.yaml fallback). If missing/ambiguous: stop and ask the human — never invent a stack from app source as the primary signal.
- Terraform verify: no cloud apply / no secrets required for default runners.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status / demo / docs / bug-report / reproduce / debug / qa / fix) — not file watch.
- Canonical artifacts: Spec Tests under `tests/features` or `tests/spec`; Dev Spec / Implementation Plan / Design Approach under `.sdd/dev-spec.md`, `.sdd/implementation-plan.md`, `.sdd/design-approach.md`; test layers `tests/unit/`, `tests/integration/`, `tests/e2e/`; evidence under `.sdd/evidence/<key>/latest/`; docs under `docs/sdd/`; client bugs under `.sdd/bugs/<id>/`.
- Evidence packs (`.sdd/evidence/<key>/latest/demo/`) are for PO/BO/QA: Portuguese business language from specs, no code dumps, no secrets, offline-relative paths. Same key updates in place as development progresses. Evidence/demo update is step 10 (after green or after the auto-loop ends with a report). After `/sdd fix`, refresh the pack for that bug/ticket evidence key.
- **Docs (optional after evidence):** `docs` / `/sdd docs` generates `docs/sdd/` from specs + Dev Spec + design + research + evidence (+ bugs when present). Must **not** invent features absent from specs/premises; mark gaps instead. Subcommands: `changelog`, `api`, `handoff`.
- **Bugfix TDD:** never “fix” client bugs without a failing regression from `/sdd reproduce` first. Human refines `REPORT.md`; agent owns DEBUG/QA/meta, regression tests, and code.
- **Research / best practices (step 11 — continuous):** during steps 2–10 (and during `/sdd debug` when uncertain), open the curated catalog (`best-practices-catalog`) for the detected stack **plus security** whenever there is doubt. Cite sources in Dev Spec / Implementation Plan / Design Approach / DEBUG; do not invent uncited practices. Premises override catalog on conflict (note it). Links + short guidance only — no scraping copyrighted full docs into the repo.
