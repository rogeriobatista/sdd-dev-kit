---
name: sdd-status
description: Report SDD pipeline status from .sdd/runs
agent: agent
---
Run **SDD: status** — read the latest `.sdd/runs/*` (and plan/canonical/ticket/demo presence). Report phase statuses, last exit codes, adapter id + stack detection source (premises/specs/stack.json/sdd.yaml), any stack warnings, and whether `.sdd/ticket.json` / `.sdd/stack.json` / `.sdd/demo/` exist. Do not modify files.
