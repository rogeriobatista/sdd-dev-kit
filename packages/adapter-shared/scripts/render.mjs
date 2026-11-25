#!/usr/bin/env node
/**
 * Render host-adapter instruction packs from shared content + host wrappers.
 * Run from repo root or this package: node packages/adapter-shared/scripts/render.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedRoot = path.resolve(__dirname, "..");
const packagesRoot = path.resolve(sharedRoot, "..");
const contentDir = path.join(sharedRoot, "content");
const templatesDir = path.join(sharedRoot, "templates");

const CONTENT_FILES = [
  "human-boundary.md",
  "stack-detection.md",
  "init.md",
  "from-ticket.md",
  "pipeline.md",
  "demo.md",
  "hard-rules.md",
];

function readContent() {
  return CONTENT_FILES.map((name) =>
    fs.readFileSync(path.join(contentDir, name), "utf8").trimEnd(),
  ).join("\n\n");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeFile(filePath, body) {
  ensureDir(filePath);
  const text = body.endsWith("\n") ? body : `${body}\n`;
  fs.writeFileSync(filePath, text, "utf8");
  console.log("wrote", path.relative(packagesRoot, filePath));
}

function copyTemplates(destRoot) {
  const walk = (dir, rel = "") => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const from = path.join(dir, entry.name);
      const toRel = path.join(rel, entry.name);
      const to = path.join(destRoot, toRel);
      if (entry.isDirectory()) {
        fs.mkdirSync(to, { recursive: true });
        walk(from, toRel);
      } else {
        ensureDir(to);
        fs.copyFileSync(from, to);
        console.log("copied", path.relative(packagesRoot, to));
      }
    }
  };
  walk(templatesDir);
}

const sharedBody = readContent();

const templateLocations = `## Template locations in this kit

- Shared source: \`packages/adapter-shared/content/\` (pipeline, from-ticket, human boundary, hard rules)
- Shared scaffold: \`packages/adapter-shared/templates/\` (\`sdd.yaml\`, \`specs/_example.md\`, \`.sdd/premises.md\`)
- Stack adapters: \`adapter-ts\`, \`adapter-python\`, \`adapter-react-vite\`, \`adapter-node-graphql\`, \`adapter-terraform\`
- Examples: \`coupon-checkout/\`, \`python-pytest-hello/\`, \`react-vite-playwright/\`, \`node-graphql-api/\`, \`terraform-module/\`
- Offline ticket fixture: \`packages/core/src/ticketing/fixtures/\`
`;

// --- Cursor ---
const cursorSkill = `---
name: sdd
description: >-
  Spec-Driven Development Protocol Kit. Use when the user invokes /sdd, asks to
  init SDD, run the SDD pipeline from natural-language specs, import a Linear or
  Jira ticket into specs, verify Cucumber/ Playwright, or check SDD status.
  Subcommands: init | from-ticket | run | verify | demo | status.
---

# /sdd — Spec-Driven Development

Protocol Kit orchestration for **Cursor**. The human edits **only** \`specs/*.md\` (prosa + Dado/Quando/Então) and optionally \`.sdd/premises.md\`. Everything else is generated or agent-owned.

Ticket import (\`/sdd from-ticket\`) is a **bootstrap**: it drafts \`specs/\` from Linear or Jira. After import, the human may still edit \`specs/\` (still the only human surface) before \`/sdd run\`.

## Cursor command map

| Intent | Invoke |
|--------|--------|
| Init | \`/sdd init\` |
| From ticket | \`/sdd from-ticket <id>\` (\`linear:\` / \`jira:\` prefix; optional \`--run\`) |
| Run pipeline | \`/sdd run\` |
| Verify only | \`/sdd verify\` |
| Demo (PO/BO/QA) | \`/sdd demo\` (optional run id) |
| Status | \`/sdd status\` |

When the user says these commands, follow the shared protocol below (same phases as Claude and Copilot adapters).

${sharedBody}

${templateLocations}
`;

writeFile(
  path.join(packagesRoot, "adapter-cursor", "skills", "sdd", "SKILL.md"),
  cursorSkill,
);

const cursorRule = `---
description: SDD Protocol Kit — human edit boundaries and agent ownership
globs:
  - specs/**/*
  - .sdd/**/*
  - tests/**/*
  - sdd.yaml
alwaysApply: true
---

# SDD human vs agent ownership

${fs.readFileSync(path.join(contentDir, "human-boundary.md"), "utf8").trim()}

## Pipeline trigger

- MVP: explicit \`/sdd run\` (and optional \`/sdd from-ticket\` bootstrap)
- Do not enable file watch as the default workflow
`;

writeFile(
  path.join(packagesRoot, "adapter-cursor", "rules", "sdd-human-edits.mdc"),
  cursorRule,
);

copyTemplates(path.join(packagesRoot, "adapter-cursor", "templates"));

// Sync kit-local Cursor skill + rule used in this repo
writeFile(
  path.join(packagesRoot, "..", ".cursor", "skills", "sdd", "SKILL.md"),
  cursorSkill,
);
writeFile(
  path.join(packagesRoot, "..", ".cursor", "rules", "sdd-human-edits.mdc"),
  cursorRule,
);

// --- Claude ---
const claudeSkill = `---
name: sdd
description: >-
  Spec-Driven Development Protocol Kit. Use when the user asks for SDD init,
  from-ticket, run, verify, demo, or status — including natural-language intents like
  "SDD: run" or "import ticket ENG-42 into specs".
---

# SDD — Spec-Driven Development (Claude)

Protocol Kit orchestration for **Claude Code / Claude in VS Code**. Same contract as Cursor and Copilot: human edits only \`specs/\`; agent runs the pipeline.

## Claude command map (natural-language intents)

| Intent | Say / invoke |
|--------|----------------|
| Init | \`SDD: init\` or "scaffold this project for SDD" |
| From ticket | \`SDD: from-ticket ENG-42\` / \`linear:ENG-42\` / \`jira:SHOP-7\` (optional \`--run\`) |
| Run pipeline | \`SDD: run\` |
| Verify only | \`SDD: verify\` |
| Demo (PO/BO/QA) | \`SDD: demo\` (optional run id) |
| Status | \`SDD: status\` |

You may also treat \`/sdd <subcommand>\` the same way when the user types it.

${sharedBody}

${templateLocations}
`;

writeFile(
  path.join(packagesRoot, "adapter-claude", "project", ".claude", "skills", "sdd", "SKILL.md"),
  claudeSkill,
);

const claudeMd = `# SDD Protocol Kit (Claude)

This project uses Spec-Driven Development. You edit **only** \`specs/*.md\` (+ \`.sdd/premises.md\` when changing project rules). The agent owns generated tests, plan, canonical, and implementation under the SDD pipeline.

## Commands (say these in chat)

- **SDD: init** — scaffold folders, \`sdd.yaml\`, premises, example spec, host instructions
- **SDD: from-ticket \`<id>\`** — Linear/Jira → draft \`specs/*.md\` (MCP when available; else core REST + env vars)
- **SDD: run** — full pipeline: normalize → executable → plan → implement → verify (diagnose loop)
- **SDD: verify** — stack runners from \`sdd.yaml\` only
- **SDD: demo** — stakeholder pack (PO/BO/QA) from test evidence → \`.sdd/evidence/<key>/latest/demo/\`
- **SDD: status** — last run / phase summary

Full procedures live in \`.claude/skills/sdd/SKILL.md\` (invoke the \`sdd\` skill when the user asks for any of the above).

## Ticketing / MCP

- Prefer Linear/Jira **MCP** tools when this host has them configured.
- Otherwise use \`@sdd-dev-kit/core\` providers with env vars only: \`LINEAR_API_KEY\`, \`JIRA_BASE_URL\`, \`JIRA_API_TOKEN\`, \`JIRA_EMAIL\`.
- Never commit secrets or put tokens on the command line.

## Human boundary (summary)

${fs.readFileSync(path.join(contentDir, "human-boundary.md"), "utf8").trim()}
`;

writeFile(
  path.join(packagesRoot, "adapter-claude", "project", "CLAUDE.md"),
  claudeMd,
);

// --- Copilot ---
const copilotInstructions = `# SDD Protocol Kit (GitHub Copilot)

This repository uses Spec-Driven Development. Humans edit **only** \`specs/*.md\` (+ \`.sdd/premises.md\` when changing project rules). Copilot runs the SDD pipeline; do not ask the human to hand-edit generated features, steps, e2e, canonical, or plan.

## Chat intents (= \`/sdd\` elsewhere)

| Say in Copilot Chat | Meaning |
|---------------------|---------|
| \`SDD: init\` | Scaffold project + install Copilot instruction/prompt files |
| \`SDD: from-ticket <id>\` | Bootstrap specs from Linear/Jira |
| \`SDD: run\` | Full pipeline |
| \`SDD: verify\` | Run test runners only |
| \`SDD: demo\` | Stakeholder demo pack from test evidence (PO/BO/QA) |
| \`SDD: status\` | Summarize \`.sdd/runs\` |

Optional slash prompts (when prompt files are installed under \`.github/prompts/\`): \`/sdd-init\`, \`/sdd-from-ticket\`, \`/sdd-run\`, \`/sdd-verify\`, \`/sdd-demo\`, \`/sdd-status\`.

${sharedBody}

## Ticketing note (Copilot gap)

- Cursor and Claude often use **MCP** for Linear/Jira.
- Copilot in VS Code may **not** expose the same MCP tools — use \`@sdd-dev-kit/core\` REST/GraphQL providers with environment variables (\`LINEAR_API_KEY\`, \`JIRA_BASE_URL\`, \`JIRA_API_TOKEN\`, \`JIRA_EMAIL\`).
- Never paste API tokens into chat or commit them.

${templateLocations}
`;

writeFile(
  path.join(
    packagesRoot,
    "adapter-vscode-copilot",
    "project",
    ".github",
    "copilot-instructions.md",
  ),
  copilotInstructions,
);

const prompts = [
  {
    file: "sdd-init.prompt.md",
    name: "sdd-init",
    description: "Scaffold the project for Spec-Driven Development (SDD: init)",
    body: `Run **SDD: init** for this workspace.

Follow the Init section of the SDD protocol (shared pipeline instructions). Create folders, \`sdd.yaml\`, premises, example spec, and ensure Copilot instruction/prompt files from \`@sdd-dev-kit/adapter-vscode-copilot\` are present. Do not overwrite existing human specs.

${fs.readFileSync(path.join(contentDir, "init.md"), "utf8").trim()}
`,
  },
  {
    file: "sdd-from-ticket.prompt.md",
    name: "sdd-from-ticket",
    description: "Bootstrap specs from a Linear or Jira ticket (SDD: from-ticket)",
    argumentHint: "ENG-42 | linear:ENG-42 | jira:SHOP-7 [--run]",
    body: `Run **SDD: from-ticket** with the ticket id from the user (or the prompt argument).

${fs.readFileSync(path.join(contentDir, "from-ticket.md"), "utf8").trim()}

Also respect human-boundary and hard-rules: do not invent acceptance criteria; env vars only for secrets.
`,
  },
  {
    file: "sdd-run.prompt.md",
    name: "sdd-run",
    description: "Execute the full SDD pipeline (SDD: run)",
    body: `Run **SDD: run** — full Spec-Driven Development pipeline for this project.

${fs.readFileSync(path.join(contentDir, "pipeline.md"), "utf8").trim()}

${fs.readFileSync(path.join(contentDir, "human-boundary.md"), "utf8").trim()}

${fs.readFileSync(path.join(contentDir, "hard-rules.md"), "utf8").trim()}
`,
  },
  {
    file: "sdd-verify.prompt.md",
    name: "sdd-verify",
    description: "Run SDD verify only (stack runners from sdd.yaml)",
    body: `Run **SDD: verify** only — execute \`sdd.yaml\` runners (\`all\`, or stack-specific keys such as cucumber/playwright/pytest/vitest/terraform). Do not normalize or implement.

Persist results under \`.sdd/runs/\` when possible and summarize exit codes. After verify, call \`updateEvidencePack({ projectRoot, runId })\` from \`@sdd-dev-kit/core\` so \`.sdd/evidence/<key>/latest/raw\` stays current for the ticket (or stable local) evidence key.
`,
  },
  {
    file: "sdd-demo.prompt.md",
    name: "sdd-demo",
    description: "Build a PO/BO/QA demo pack from test evidence (SDD: demo)",
    argumentHint: "[runId] [--id <evidenceKey>]",
    body: `Run **SDD: demo** — build a stakeholder demo pack from the latest (or named) verify evidence.

${fs.readFileSync(path.join(contentDir, "demo.md"), "utf8").trim()}

Prefer \`buildDemo({ projectRoot, runId?, evidenceKey? })\` from \`@sdd-dev-kit/core\`. Report the stable path \`.sdd/evidence/<key>/latest/demo/index.html\` (and \`SUMMARY.md\`).
`,
  },
  {
    file: "sdd-status.prompt.md",
    name: "sdd-status",
    description: "Report SDD pipeline status from .sdd/runs",
    body: `Run **SDD: status** — read the latest \`.sdd/runs/*\` (and plan/canonical/ticket/evidence/demo presence). Report phase statuses, last exit codes, adapter id + stack detection source (premises/specs/stack.json/sdd.yaml), any stack warnings, resolved evidenceKey, and whether \`.sdd/ticket.json\` / \`.sdd/stack.json\` / \`.sdd/evidence/\` exist. Do not modify files.
`,
  },
];

for (const p of prompts) {
  const front = [
    "---",
    `name: ${p.name}`,
    `description: ${p.description}`,
    "agent: agent",
  ];
  if (p.argumentHint) front.push(`argument-hint: ${p.argumentHint}`);
  front.push("---", "");
  writeFile(
    path.join(
      packagesRoot,
      "adapter-vscode-copilot",
      "project",
      ".github",
      "prompts",
      p.file,
    ),
    front.join("\n") + p.body,
  );
}

console.log("render complete");
