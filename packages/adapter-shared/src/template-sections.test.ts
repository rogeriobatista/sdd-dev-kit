import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedRoot = path.resolve(__dirname, "..");
const packagesRoot = path.resolve(sharedRoot, "..");
const contentDir = path.join(sharedRoot, "content");

const REQUIRED_MARKERS = [
  // pipeline phases
  "normalize",
  "executable",
  "research",
  "plan",
  "implement",
  "verify",
  "diagnose",
  "report",
  // demo stakeholder pack
  "demo",
  "buildDemo",
  // from-ticket bootstrap
  "from-ticket",
  "Linear",
  "Jira",
  // human edit boundary
  "specs/",
  "Dado",
  "Quando",
  "Então",
  // stack from specs
  "detectStack",
  "premises.md",
];

function read(relFromPackages: string): string {
  return fs.readFileSync(path.join(packagesRoot, relFromPackages), "utf8");
}

function readShared(name: string): string {
  return fs.readFileSync(path.join(contentDir, name), "utf8");
}

function assertMarkers(label: string, text: string, markers: string[] = REQUIRED_MARKERS) {
  for (const marker of markers) {
    assert.ok(
      text.toLowerCase().includes(marker.toLowerCase()),
      `${label} must include required section/marker: ${marker}`,
    );
  }
}

describe("adapter-shared content", () => {
  it("ships pipeline, research, from-ticket, human-boundary, hard-rules, init, stack-detection, demo", () => {
    for (const name of [
      "pipeline.md",
      "research.md",
      "from-ticket.md",
      "human-boundary.md",
      "hard-rules.md",
      "init.md",
      "stack-detection.md",
      "demo.md",
    ]) {
      const body = readShared(name);
      assert.ok(body.trim().length > 0, `${name} should be non-empty`);
    }
  });

  it("best-practices catalog exists with required domain sections and version", () => {
    const md = readShared("best-practices-catalog.md");
    assertMarkers("best-practices-catalog.md", md, [
      "catalogVersion",
      "Frontend",
      "Backend",
      "Infra",
      "Security",
      "react.dev",
      "playwright.dev",
      "graphql.org",
      "pytest",
      "12factor",
      "hashicorp.com/terraform",
      "owasp.org",
    ]);
    const jsonPath = path.join(contentDir, "best-practices-catalog.json");
    assert.ok(fs.existsSync(jsonPath), "best-practices-catalog.json must exist");
    const catalog = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
      catalogVersion: number;
      domains: Record<string, unknown>;
      stackDomains: Record<string, string[]>;
    };
    assert.equal(catalog.catalogVersion, 1);
    for (const domain of ["frontend", "backend", "infra", "security"]) {
      assert.ok(catalog.domains[domain], `json domains.${domain} required`);
    }
    assert.ok(catalog.stackDomains["react-vite"]?.includes("security"));
    assert.ok(catalog.stackDomains.terraform?.includes("infra"));
  });

  it("research content covers catalog, outputs, and premises override", () => {
    assertMarkers("research", readShared("research.md"), [
      "best-practices-catalog",
      "BEST_PRACTICES.md",
      "sources.json",
      "premises",
      "Security",
      "WebSearch",
    ]);
  });

  it("demo content covers buildDemo, evidence key, and stakeholder audience", () => {
    assertMarkers("demo", readShared("demo.md"), [
      "buildDemo",
      "resolveEvidenceKey",
      "updateEvidencePack",
      "evidenceKey",
      ".sdd/evidence/",
      "PO",
      "index.html",
      "SUMMARY.md",
      "manifest.json",
    ]);
  });

  it("stack-detection documents authoritative order and detectStack", () => {
    assertMarkers("stack-detection", readShared("stack-detection.md"), [
      "detectStack",
      "premises.md",
      "stack.json",
      "sdd.yaml",
      "needsClarification",
    ]);
  });

  it("shared pipeline documents all phases and auto-loop semantics", () => {
    assertMarkers("content/pipeline.md", readShared("pipeline.md"), [
      "normalize",
      "executable",
      "research",
      "plan",
      "implement",
      "verify",
      "diagnose",
      "report",
      "Human iteration surface",
      "Automated loop",
      "maxDiagnoseIterations",
    ]);
  });

  it("hard-rules and human-boundary mark specs as only human gate", () => {
    assertMarkers("hard-rules", readShared("hard-rules.md"), [
      "Human iteration surface",
      "automated loop",
      "specs/",
    ]);
    assertMarkers("human-boundary", readShared("human-boundary.md"), [
      "only human iteration surface",
      "auto-loop",
      "specs/",
    ]);
  });

  it("shared from-ticket and human-boundary cover edit rules", () => {
    assertMarkers("from-ticket", readShared("from-ticket.md"), [
      "from-ticket",
      "Linear",
      "Jira",
      "specs/",
    ]);
    assertMarkers("human-boundary", readShared("human-boundary.md"), [
      "specs/",
      "Dado",
      "Quando",
      "Então",
    ]);
  });

  it("shared scaffold templates exist", () => {
    for (const rel of [
      "templates/sdd.yaml",
      "templates/specs/_example.md",
      "templates/.sdd/premises.md",
    ]) {
      const p = path.join(sharedRoot, rel);
      assert.ok(fs.existsSync(p), `missing ${rel}`);
    }
  });
});

describe("rendered host adapters include required sections", () => {
  const targets: { label: string; rel: string }[] = [
    { label: "cursor skill", rel: "adapter-cursor/skills/sdd/SKILL.md" },
    {
      label: "cursor research skill",
      rel: "adapter-cursor/skills/sdd-research/SKILL.md",
    },
    { label: "cursor rule", rel: "adapter-cursor/rules/sdd-human-edits.mdc" },
    {
      label: "claude skill",
      rel: "adapter-claude/project/.claude/skills/sdd/SKILL.md",
    },
    { label: "claude CLAUDE.md", rel: "adapter-claude/project/CLAUDE.md" },
    {
      label: "copilot instructions",
      rel: "adapter-vscode-copilot/project/.github/copilot-instructions.md",
    },
    {
      label: "copilot sdd-run prompt",
      rel: "adapter-vscode-copilot/project/.github/prompts/sdd-run.prompt.md",
    },
    {
      label: "copilot sdd-research prompt",
      rel: "adapter-vscode-copilot/project/.github/prompts/sdd-research.prompt.md",
    },
    {
      label: "copilot sdd-from-ticket prompt",
      rel: "adapter-vscode-copilot/project/.github/prompts/sdd-from-ticket.prompt.md",
    },
  ];

  for (const t of targets) {
    it(`${t.label} contains pipeline / from-ticket / human-boundary markers`, () => {
      const text = read(t.rel);
      // Cursor rule is boundary-focused; still must mention specs + GWT + from-ticket exception
      if (t.rel.endsWith("sdd-human-edits.mdc")) {
        assertMarkers(t.label, text, ["specs/", "Dado", "Quando", "Então", "from-ticket"]);
        return;
      }
      if (t.rel.endsWith("CLAUDE.md")) {
        assertMarkers(t.label, text, [
          "specs/",
          "from-ticket",
          "SDD: run",
          "research",
          "normalize",
        ]);
        // CLAUDE.md is a short pointer; phases live in the skill
        return;
      }
      if (t.rel.includes("sdd-from-ticket.prompt.md")) {
        assertMarkers(t.label, text, ["from-ticket", "Linear", "Jira", "specs/"]);
        return;
      }
      if (t.rel.includes("sdd-research")) {
        assertMarkers(t.label, text, [
          "research",
          "best-practices-catalog",
          "BEST_PRACTICES.md",
          "sources.json",
        ]);
        return;
      }
      assertMarkers(t.label, text);
    });
  }

  it("cursor templates stay in sync with shared scaffold", () => {
    for (const rel of [
      "sdd.yaml",
      path.join("specs", "_example.md"),
      path.join(".sdd", "premises.md"),
    ]) {
      const shared = fs.readFileSync(path.join(sharedRoot, "templates", rel), "utf8");
      const cursor = fs.readFileSync(
        path.join(packagesRoot, "adapter-cursor", "templates", rel),
        "utf8",
      );
      assert.equal(
        cursor,
        shared,
        `adapter-cursor/templates/${rel} must match adapter-shared/templates/${rel} (run npm run render -w @rogeriobatista/adapter-shared)`,
      );
    }
  });

  it("copilot prompt set covers all subcommands", () => {
    const dir = path.join(
      packagesRoot,
      "adapter-vscode-copilot",
      "project",
      ".github",
      "prompts",
    );
    for (const name of [
      "sdd-init.prompt.md",
      "sdd-from-ticket.prompt.md",
      "sdd-run.prompt.md",
      "sdd-research.prompt.md",
      "sdd-verify.prompt.md",
      "sdd-demo.prompt.md",
      "sdd-status.prompt.md",
    ]) {
      assert.ok(fs.existsSync(path.join(dir, name)), `missing prompt ${name}`);
    }
  });
});
