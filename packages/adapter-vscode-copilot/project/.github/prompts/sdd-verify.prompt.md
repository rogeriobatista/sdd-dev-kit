---
name: sdd-verify
description: Run SDD verify only (stack runners from sdd.yaml)
agent: agent
---
Run **SDD: verify** only — execute `sdd.yaml` runners covering test layers when present (`all`, `spec`, `unit`, `integration`, `e2e`, or stack-specific keys such as cucumber/playwright/pytest/vitest/terraform). Do not rewrite specs or implement.

Persist results under `.sdd/runs/` when possible and summarize exit codes. After verify, call `updateEvidencePack({ projectRoot, runId })` from `@rogeriobatista/core` so `.sdd/evidence/<key>/latest/raw` stays current for the ticket (or stable local) evidence key.
