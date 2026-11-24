---
name: sdd-verify
description: Run SDD verify only (stack runners from sdd.yaml)
agent: agent
---
Run **SDD: verify** only — execute `sdd.yaml` runners (`all`, or stack-specific keys such as cucumber/playwright/pytest/vitest/terraform). Do not normalize or implement.

Persist results under `.sdd/runs/` when possible and summarize exit codes.
