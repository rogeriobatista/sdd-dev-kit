import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  alignSddYamlAdapter,
  detectStack,
  normalizeStackId,
  scoreStackKeywords,
  writeStackProvenance,
} from "./stack.js";

function tmpProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sdd-stack-"));
}

function write(root: string, rel: string, contents: string): void {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents, "utf8");
}

describe("normalizeStackId / scoreStackKeywords", () => {
  it("maps synonyms to canonical ids", () => {
    assert.equal(normalizeStackId("ts"), "typescript");
    assert.equal(normalizeStackId("pytest"), "python");
    assert.equal(normalizeStackId("react"), "react-vite");
    assert.equal(normalizeStackId("graphql"), "node-graphql");
    assert.equal(normalizeStackId("tf"), "terraform");
    assert.equal(normalizeStackId("cobol"), null);
  });

  it("scores python premises text", () => {
    const scored = scoreStackKeywords("- Python 3.11+\n- pytest\n");
    assert.equal(scored[0]?.stack, "python");
  });

  it("scores react+vite over bare typescript", () => {
    const scored = scoreStackKeywords("- React + Vite\n- Playwright\n");
    assert.equal(scored[0]?.stack, "react-vite");
    assert.ok(!scored.some((s) => s.stack === "typescript"));
  });

  it("scores graphql + node as node-graphql", () => {
    const scored = scoreStackKeywords(
      "- Node + TypeScript\n- GraphQL Yoga\n- Vitest\n",
    );
    assert.equal(scored[0]?.stack, "node-graphql");
  });

  it("scores terraform", () => {
    const scored = scoreStackKeywords("- Terraform >= 1.6\n- null provider\n");
    assert.equal(scored[0]?.stack, "terraform");
  });
});

describe("detectStack", () => {
  it("detects python from premises", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/premises.md",
      `# Premises\n\n## Stack\n- Python 3.11+\n- pytest\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "python");
    assert.equal(result.source, "premises");
    assert.equal(result.confidence, "high");
    assert.equal(result.needsClarification, false);
  });

  it("detects react-vite from premises", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/premises.md",
      `# Premises\n\n## Stack\n- React + Vite\n- Playwright for @ui\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "react-vite");
    assert.equal(result.source, "premises");
  });

  it("detects terraform from premises", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/premises.md",
      `# Premises\n\n## Stack\n- Terraform >= 1.6\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "terraform");
    assert.equal(result.source, "premises");
  });

  it("detects node-graphql from premises", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/premises.md",
      `# Premises\n\n## Stack\n- Node + TypeScript\n- GraphQL Yoga\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "node-graphql");
    assert.equal(result.source, "premises");
  });

  it("detects typescript from coupon-style premises", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/premises.md",
      `## Stack\n- TypeScript (Node)\n- Cucumber para @api\n- Playwright para @ui\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "typescript");
    assert.equal(result.source, "premises");
  });

  it("detects stack from specs frontmatter when premises omit stack", () => {
    const root = tmpProject();
    write(root, ".sdd/premises.md", `# Premises\n\n## Tags\n- @api\n`);
    write(
      root,
      "specs/hello.md",
      `---\nstack: python\n---\n\n## Intenção\nHello\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "python");
    assert.equal(result.source, "specs");
    assert.equal(result.confidence, "high");
  });

  it("detects @stack: tag in specs", () => {
    const root = tmpProject();
    write(
      root,
      "specs/feature.md",
      `# Feature\n\n@stack:terraform\n\n## Cenários\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "terraform");
    assert.equal(result.source, "specs");
  });

  it("prefers premises over specs", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/premises.md",
      `## Stack\n- Python\n- pytest\n`,
    );
    write(
      root,
      "specs/a.md",
      `---\nstack: typescript\n---\n\n# A\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "python");
    assert.equal(result.source, "premises");
  });

  it("marks ambiguous premises as needing clarification", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/premises.md",
      `## Stack\n- Python and Terraform and React\n- pytest + terraform + vite\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, null);
    assert.equal(result.source, "ambiguous");
    assert.equal(result.needsClarification, true);
    assert.ok(result.candidates.length >= 2);
  });

  it("falls back to sdd.yaml with warning when specs omit stack", () => {
    const root = tmpProject();
    write(root, "sdd.yaml", `adapter: python\nrunners:\n  all: pytest -q\n`);
    write(root, "specs/a.md", `# Spec\n\n## Intenção\nSem stack\n`);
    const result = detectStack(root);
    assert.equal(result.stack, "python");
    assert.equal(result.source, "sdd.yaml");
    assert.equal(result.confidence, "low");
    assert.ok(result.warnings.some((w) => /premises\/specs/i.test(w)));
  });

  it("uses stack.json when premises/specs do not declare stack", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/stack.json",
      JSON.stringify({
        stack: "react-vite",
        source: "premises",
        detectedAt: "2026-11-24T00:00:00.000Z",
        override: true,
      }),
    );
    const result = detectStack(root);
    assert.equal(result.stack, "react-vite");
    assert.equal(result.source, "stack.json");
  });

  it("returns missing when nothing declares stack", () => {
    const root = tmpProject();
    write(root, "specs/a.md", `# Only prose\n`);
    const result = detectStack(root);
    assert.equal(result.stack, null);
    assert.equal(result.source, "missing");
    assert.equal(result.needsClarification, true);
  });

  it("weak package-manifest fallback after all docs fail", () => {
    const root = tmpProject();
    write(
      root,
      "pyproject.toml",
      `[project]\nname = "x"\n\n[tool.pytest.ini_options]\ntestpaths = ["tests"]\n`,
    );
    const result = detectStack(root);
    assert.equal(result.stack, "python");
    assert.equal(result.source, "package-manifest");
    assert.equal(result.confidence, "low");
    assert.equal(result.needsClarification, true);
  });
});

describe("writeStackProvenance / alignSddYamlAdapter", () => {
  it("writes .sdd/stack.json provenance", () => {
    const root = tmpProject();
    const provenance = writeStackProvenance(root, {
      stack: "python",
      source: "premises",
      confidence: "high",
      candidates: ["python"],
      warnings: [],
      needsClarification: false,
    }, "2026-11-24T12:00:00.000Z");
    assert.ok(provenance);
    const raw = fs.readFileSync(path.join(root, ".sdd", "stack.json"), "utf8");
    const json = JSON.parse(raw) as { stack: string; source: string };
    assert.equal(json.stack, "python");
    assert.equal(json.source, "premises");
  });

  it("aligns top-level adapter in sdd.yaml", () => {
    const root = tmpProject();
    write(root, "sdd.yaml", `version: "1"\nadapter: typescript\n`);
    assert.equal(alignSddYamlAdapter(root, "python"), true);
    const text = fs.readFileSync(path.join(root, "sdd.yaml"), "utf8");
    assert.match(text, /^adapter:\s*python$/m);
  });
});
