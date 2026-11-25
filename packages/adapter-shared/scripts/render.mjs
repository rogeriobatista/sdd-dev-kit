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
  "research.md",
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

- Shared source: \`packages/adapter-shared/content/\` (pipeline, research, from-ticket, human boundary, hard rules, best-practices catalog)
- Best-practices catalog: \`packages/adapter-shared/content/best-practices-catalog.md\` (+ \`.json\`)
- Shared scaffold: \`packages/adapter-shared/templates/\` (\`sdd.yaml\`, \`specs/_example.md\`, \`.sdd/premises.md\`, \`.sdd/dev-spec.md\`, \`.sdd/implementation-plan.md\`, \`.sdd/design-approach.md\`)
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
  Jira ticket into specs, research best practices, verify Cucumber/ Playwright,
  or check SDD status.
  Subcommands: init | from-ticket | run | research | verify | demo | status.
---

# /sdd — Spec-Driven Development

Protocol Kit orchestration for **Cursor**. The human edits **only** \`specs/*.md\` (prosa + Dado/Quando/Então) and optionally \`.sdd/premises.md\`. Everything else is generated or agent-owned.

Ticket import (\`/sdd from-ticket\`) is a **bootstrap**: it drafts \`specs/\` from Linear or Jira, then **pauses for human spec iteration** (unless \`--run\` and specs are already complete). After specs are accepted, \`/sdd run\` runs **canonical steps 2–10** automatically until all test levels pass — do not stop mid-loop to ask the human to fix code. Step 11 (best practices) is continuous during those steps.

## Cursor command map

| Intent | Invoke |
|--------|--------|
| Init | \`/sdd init\` |
| From ticket | \`/sdd from-ticket <id>\` (\`linear:\` / \`jira:\` prefix; optional \`--run\`) |
| Run pipeline | \`/sdd run\` |
| Research (best practices) | \`/sdd research\` (step 11 continuous policy; also standalone) |
| Verify only | \`/sdd verify\` |
| Demo (PO/BO/QA) | \`/sdd demo\` (optional run id) |
| Status | \`/sdd status\` |

When the user says these commands, follow the shared protocol below (same phases as Claude and Copilot adapters).
On \`run\` / docs / \`implement\` / \`research\`: open the best-practices catalog for the detected stack **plus security**; cite sources in Dev Spec / Implementation Plan / Design Approach.

${sharedBody}

${templateLocations}
`;

writeFile(
  path.join(packagesRoot, "adapter-cursor", "skills", "sdd", "SKILL.md"),
  cursorSkill,
);

const cursorResearchSkill = `---
name: sdd-research
description: >-
  SDD best-practices research. Use when the user invokes /sdd research, SDD: research,
  or when plan/implement needs market standards for frontend, backend, infra, or security.
---

# /sdd research — Best practices

Thin Cursor skill: follow the **Research (best practices)** procedure from the main \`sdd\` skill / shared content.

## Catalog (open first)

- \`packages/adapter-shared/content/best-practices-catalog.md\`
- \`packages/adapter-shared/content/best-practices-catalog.json\` (\`catalogVersion\`)

Select domains for the **detected stack** + **security (always)**. Prefer MCP WebSearch / fetch of catalog URLs; otherwise use the curated links.

## Output (agent-owned)

\`.sdd/research/<encodedEvidenceKey>/BEST_PRACTICES.md\` + \`sources.json\`

Cite every applied practice in Dev Spec / Implementation Plan / Design Approach. Premises win on conflict — note it. No scraping of full copyrighted docs; no secrets. Step 11 is continuous during \`/sdd run\`, not a separate stop.

Full steps: shared \`research.md\` (rendered into the \`sdd\` skill).
`;

writeFile(
  path.join(packagesRoot, "adapter-cursor", "skills", "sdd-research", "SKILL.md"),
  cursorResearchSkill,
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
- Human iterates only on \`specs/\` (step 1); \`/sdd run\` automates steps 2–10 until all test levels pass (or diagnose cap); step 11 = continuous best practices
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
  path.join(packagesRoot, "..", ".cursor", "skills", "sdd-research", "SKILL.md"),
  cursorResearchSkill,
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
  from-ticket, run, research, verify, demo, or status — including natural-language
  intents like "SDD: run" or "import ticket ENG-42 into specs".
---

# SDD — Spec-Driven Development (Claude)

Protocol Kit orchestration for **Claude Code / Claude in VS Code**. Same contract as Cursor and Copilot: human iterates only on \`specs/\` (step 1); after specs are accepted, \`SDD: run\` automates steps 2–10 until all test levels pass (no mid-loop human code fixes). Step 11 = continuous best practices.

## Claude command map (natural-language intents)

| Intent | Say / invoke |
|--------|----------------|
| Init | \`SDD: init\` or "scaffold this project for SDD" |
| From ticket | \`SDD: from-ticket ENG-42\` / \`linear:ENG-42\` / \`jira:SHOP-7\` (optional \`--run\`) |
| Run pipeline | \`SDD: run\` |
| Research (best practices) | \`SDD: research\` (step 11 continuous; also standalone) |
| Verify only | \`SDD: verify\` |
| Demo (PO/BO/QA) | \`SDD: demo\` (optional run id) |
| Status | \`SDD: status\` |

You may also treat \`/sdd <subcommand>\` the same way when the user types it.
On \`run\` / docs / \`implement\` / \`research\`: open the best-practices catalog for the detected stack **plus security**; cite sources in Dev Spec / Implementation Plan / Design Approach.

${sharedBody}

${templateLocations}
`;

writeFile(
  path.join(packagesRoot, "adapter-claude", "project", ".claude", "skills", "sdd", "SKILL.md"),
  claudeSkill,
);

const claudeMd = `# SDD Protocol Kit (Claude)

This project uses Spec-Driven Development. You edit **only** \`specs/*.md\` (+ \`.sdd/premises.md\` when changing project rules). The agent owns Spec Tests, Dev Spec, Implementation Plan, Design Approach, unit/integration/e2e tests, canonical, research, evidence, and implementation under the SDD pipeline.

## Commands (say these in chat)

- **SDD: init** — scaffold folders, \`sdd.yaml\`, premises, example spec, host instructions
- **SDD: from-ticket \`<id>\`** — Linear/Jira → draft \`specs/*.md\`, then pause for human spec iteration (unless \`--run\` + complete specs)
- **SDD: run** — canonical steps 2–10 after specs (spec-tests → … → evidence; implement/verify until all layers pass)
- **SDD: research** — best-practices pack (step 11 continuous policy; optional standalone)
- **SDD: verify** — stack runners from \`sdd.yaml\` (spec/unit/integration/e2e/all)
- **SDD: demo** — stakeholder pack (PO/BO/QA) from test evidence → \`.sdd/evidence/<key>/latest/demo/\`
- **SDD: status** — last run / phase summary

Full procedures live in \`.claude/skills/sdd/SKILL.md\` (invoke the \`sdd\` skill when the user asks for any of the above).

## Ticketing / MCP

- Prefer Linear/Jira **MCP** tools when this host has them configured.
- Otherwise use \`@rogeriobatista/core\` providers with env vars only: \`LINEAR_API_KEY\`, \`JIRA_BASE_URL\`, \`JIRA_API_TOKEN\`, \`JIRA_EMAIL\`.
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

This repository uses Spec-Driven Development. Humans edit **only** \`specs/*.md\` (+ \`.sdd/premises.md\` when changing project rules). Copilot runs the SDD pipeline; do not ask the human to hand-edit generated Spec/unit/integration/e2e tests, Dev Spec, Implementation Plan, Design Approach, or canonical.

## Chat intents (= \`/sdd\` elsewhere)

| Say in Copilot Chat | Meaning |
|---------------------|---------|
| \`SDD: init\` | Scaffold project + install Copilot instruction/prompt files |
| \`SDD: from-ticket <id>\` | Bootstrap specs → pause for human iteration (unless \`--run\`) |
| \`SDD: run\` | Canonical steps 2–10 until all test levels pass (step 11 continuous; diagnose cap) |
| \`SDD: research\` | Best-practices research pack (catalog + sources) |
| \`SDD: verify\` | Run test runners only (spec/unit/integration/e2e/all) |
| \`SDD: demo\` | Stakeholder demo pack from test evidence (PO/BO/QA) |
| \`SDD: status\` | Summarize \`.sdd/runs\` |

Optional slash prompts (when prompt files are installed under \`.github/prompts/\`): \`/sdd-init\`, \`/sdd-from-ticket\`, \`/sdd-run\`, \`/sdd-research\`, \`/sdd-verify\`, \`/sdd-demo\`, \`/sdd-status\`.
On \`run\` / docs / \`implement\` / \`research\`: open the best-practices catalog for the detected stack **plus security**; cite sources in Dev Spec / Implementation Plan / Design Approach.

${sharedBody}

## Ticketing note (Copilot gap)

- Cursor and Claude often use **MCP** for Linear/Jira.
- Copilot in VS Code may **not** expose the same MCP tools — use \`@rogeriobatista/core\` REST/GraphQL providers with environment variables (\`LINEAR_API_KEY\`, \`JIRA_BASE_URL\`, \`JIRA_API_TOKEN\`, \`JIRA_EMAIL\`).
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

Follow the Init section of the SDD protocol (shared pipeline instructions). Create folders, \`sdd.yaml\`, premises, example spec, and ensure Copilot instruction/prompt files from \`@rogeriobatista/adapter-vscode-copilot\` are present. Do not overwrite existing human specs.

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

${fs.readFileSync(path.join(contentDir, "research.md"), "utf8").trim()}

${fs.readFileSync(path.join(contentDir, "human-boundary.md"), "utf8").trim()}

${fs.readFileSync(path.join(contentDir, "hard-rules.md"), "utf8").trim()}
`,
  },
  {
    file: "sdd-research.prompt.md",
    name: "sdd-research",
    description: "Research market best practices for the detected stack (SDD: research)",
    body: `Run **SDD: research** — consult the curated best-practices catalog for the detected stack **plus security**, then write \`.sdd/research/<key>/BEST_PRACTICES.md\` + \`sources.json\`.

${fs.readFileSync(path.join(contentDir, "research.md"), "utf8").trim()}

Open \`packages/adapter-shared/content/best-practices-catalog.md\` (and \`.json\`). Prefer MCP WebSearch / fetch of official catalog URLs. Cite sources; premises win on conflict. No scraping of full copyrighted docs; no secrets.
`,
  },
  {
    file: "sdd-verify.prompt.md",
    name: "sdd-verify",
    description: "Run SDD verify only (stack runners from sdd.yaml)",
    body: `Run **SDD: verify** only — execute \`sdd.yaml\` runners covering test layers when present (\`all\`, \`spec\`, \`unit\`, \`integration\`, \`e2e\`, or stack-specific keys such as cucumber/playwright/pytest/vitest/terraform). Do not rewrite specs or implement.

Persist results under \`.sdd/runs/\` when possible and summarize exit codes. After verify, call \`updateEvidencePack({ projectRoot, runId })\` from \`@rogeriobatista/core\` so \`.sdd/evidence/<key>/latest/raw\` stays current for the ticket (or stable local) evidence key.
`,
  },
  {
    file: "sdd-demo.prompt.md",
    name: "sdd-demo",
    description: "Build a PO/BO/QA demo pack from test evidence (SDD: demo)",
    argumentHint: "[runId] [--id <evidenceKey>]",
    body: `Run **SDD: demo** — build a stakeholder demo pack from the latest (or named) verify evidence.

${fs.readFileSync(path.join(contentDir, "demo.md"), "utf8").trim()}

Prefer \`buildDemo({ projectRoot, runId?, evidenceKey? })\` from \`@rogeriobatista/core\`. Report the stable path \`.sdd/evidence/<key>/latest/demo/index.html\` (and \`SUMMARY.md\`).
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
