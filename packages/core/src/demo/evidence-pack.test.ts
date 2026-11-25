import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildDemo } from "./build-demo.js";
import {
  encodeEvidenceKeyForPath,
  resolveEvidenceKey,
  updateEvidencePack,
} from "./evidence-pack.js";

function tmpProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sdd-evidence-"));
}

function write(root: string, rel: string, contents: string | Buffer): void {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

function seedMinimalRun(root: string, runId: string): void {
  write(
    root,
    `specs/feature.md`,
    `# Feature

## Intenção
Demo fixture.

## Cenários

### Cenário A @api
Dado x
Quando y
Então z
`,
  );
  write(
    root,
    `.sdd/runs/${runId}/report.json`,
    JSON.stringify({
      id: runId,
      startedAt: "2026-11-24T12:00:00.000Z",
      finishedAt: "2026-11-24T12:01:00.000Z",
      status: "passed",
      phases: [{ phase: "verify", status: "passed" }],
      diagnoseIterations: 0,
      runners: [{ name: "all", exitCode: 0 }],
    }),
  );
  write(
    root,
    "reports/cucumber.json",
    JSON.stringify([
      {
        elements: [
          {
            name: "Cenário A",
            steps: [{ result: { status: "passed" } }],
          },
        ],
      },
    ]),
  );
}

describe("encodeEvidenceKeyForPath", () => {
  it("replaces colon for Windows-safe directory names", () => {
    assert.equal(encodeEvidenceKeyForPath("linear:ENG-42"), "linear_ENG-42");
    assert.equal(encodeEvidenceKeyForPath("jira:SHOP-7"), "jira_SHOP-7");
  });
});

describe("resolveEvidenceKey", () => {
  it("uses ticket provenance → linear:ENG-42", () => {
    const root = tmpProject();
    write(
      root,
      ".sdd/ticket.json",
      JSON.stringify({
        fetchedAt: "2026-11-24T12:00:00.000Z",
        ref: { id: "ENG-42", provider: "linear" },
        ticket: {
          id: "ENG-42",
          url: "https://linear.app/acme/issue/ENG-42",
          title: "Checkout coupon",
          description: "",
          acceptanceCriteria: [],
          labels: [],
          provider: "linear",
        },
        draftSpecPath: "specs/ENG-42-checkout.md",
      }),
    );

    const resolved = resolveEvidenceKey({ projectRoot: root });
    assert.equal(resolved.evidenceKey, "linear:ENG-42");
    assert.equal(resolved.source, "ticket");
    assert.equal(resolved.encodedKey, "linear_ENG-42");
    assert.match(resolved.evidencePath, /\.sdd\/evidence\/linear_ENG-42$/);
  });

  it("uses sdd.yaml evidence.key over ticket", () => {
    const root = tmpProject();
    write(
      root,
      "sdd.yaml",
      `adapter: typescript
evidence:
  key: custom:FEATURE-1
`,
    );
    write(
      root,
      ".sdd/ticket.json",
      JSON.stringify({
        fetchedAt: "2026-11-24T12:00:00.000Z",
        ref: { id: "ENG-42", provider: "linear" },
        ticket: {
          id: "ENG-42",
          url: "https://linear.app/x",
          title: "t",
          description: "",
          acceptanceCriteria: [],
          labels: [],
          provider: "linear",
        },
        draftSpecPath: "specs/x.md",
      }),
    );

    const resolved = resolveEvidenceKey({ projectRoot: root });
    assert.equal(resolved.evidenceKey, "custom:FEATURE-1");
    assert.equal(resolved.source, "sdd.yaml");
  });

  it("honors explicit override over yaml and ticket", () => {
    const root = tmpProject();
    write(root, "sdd.yaml", `evidence:\n  key: yaml:KEY\n`);
    write(
      root,
      ".sdd/ticket.json",
      JSON.stringify({
        fetchedAt: "2026-11-24T12:00:00.000Z",
        ref: { id: "ENG-42", provider: "linear" },
        ticket: {
          id: "ENG-42",
          url: "https://linear.app/x",
          title: "t",
          description: "",
          acceptanceCriteria: [],
          labels: [],
          provider: "linear",
        },
        draftSpecPath: "specs/x.md",
      }),
    );

    const resolved = resolveEvidenceKey({
      projectRoot: root,
      evidenceKey: "cli:OVERRIDE",
    });
    assert.equal(resolved.evidenceKey, "cli:OVERRIDE");
    assert.equal(resolved.source, "override");
  });

  it("creates and reuses .sdd/evidence-id.json when no ticket", () => {
    const root = tmpProject();
    const first = resolveEvidenceKey({ projectRoot: root });
    assert.equal(first.source, "evidence-id");
    assert.match(first.evidenceKey, /^local:[0-9a-f-]{36}$/i);
    assert.ok(fs.existsSync(path.join(root, ".sdd/evidence-id.json")));

    const second = resolveEvidenceKey({ projectRoot: root });
    assert.equal(second.evidenceKey, first.evidenceKey);
    assert.equal(second.source, "evidence-id");
  });
});

describe("updateEvidencePack", () => {
  it("with ticket → key linear:ENG-42 and updates latest in place", () => {
    const root = tmpProject();
    seedMinimalRun(root, "run-001");
    write(
      root,
      ".sdd/ticket.json",
      JSON.stringify({
        fetchedAt: "2026-11-24T12:00:00.000Z",
        ref: { id: "ENG-42", provider: "linear" },
        ticket: {
          id: "ENG-42",
          url: "https://linear.app/acme/issue/ENG-42",
          title: "Checkout coupon",
          description: "",
          acceptanceCriteria: [],
          labels: [],
          provider: "linear",
        },
        draftSpecPath: "specs/ENG-42-checkout.md",
      }),
    );

    const demo = buildDemo({ projectRoot: root, runId: "run-001" });
    assert.equal(demo.evidenceKey, "linear:ENG-42");
    assert.ok(
      demo.demoDir.replace(/\\/g, "/").includes(
        ".sdd/evidence/linear_ENG-42/latest/demo",
      ),
    );
    assert.ok(fs.existsSync(demo.indexHtmlPath));
    assert.ok(
      fs.existsSync(
        path.join(root, ".sdd/evidence/linear_ENG-42/meta.json"),
      ),
    );
    assert.ok(
      fs.existsSync(
        path.join(root, ".sdd/evidence/linear_ENG-42/latest/run-report.json"),
      ),
    );
    assert.ok(
      fs.existsSync(
        path.join(root, ".sdd/evidence/linear_ENG-42/latest/raw"),
      ),
    );

    const meta = JSON.parse(
      fs.readFileSync(
        path.join(root, ".sdd/evidence/linear_ENG-42/meta.json"),
        "utf8",
      ),
    );
    assert.equal(meta.evidenceKey, "linear:ENG-42");
    assert.equal(meta.lastRunId, "run-001");
    assert.equal(meta.runPath, ".sdd/runs/run-001");
    assert.equal(meta.ticket?.url, "https://linear.app/acme/issue/ENG-42");

    const ticket = JSON.parse(
      fs.readFileSync(path.join(root, ".sdd/ticket.json"), "utf8"),
    );
    assert.equal(ticket.evidenceKey, "linear:ENG-42");
    assert.equal(ticket.evidencePath, ".sdd/evidence/linear_ENG-42");

    // Second update overwrites latest (same key)
    seedMinimalRun(root, "run-002");
    // keep cucumber from first seed; just add run-002 report
    write(
      root,
      ".sdd/runs/run-002/report.json",
      JSON.stringify({
        id: "run-002",
        startedAt: "2026-11-24T13:00:00.000Z",
        status: "passed",
        phases: [{ phase: "verify", status: "passed" }],
        diagnoseIterations: 0,
        runners: [{ name: "all", exitCode: 0 }],
      }),
    );
    const second = buildDemo({ projectRoot: root, runId: "run-002" });
    assert.equal(second.evidenceKey, "linear:ENG-42");
    const meta2 = JSON.parse(
      fs.readFileSync(
        path.join(root, ".sdd/evidence/linear_ENG-42/meta.json"),
        "utf8",
      ),
    );
    assert.equal(meta2.lastRunId, "run-002");
    assert.ok(fs.existsSync(second.indexHtmlPath));
  });

  it("without ticket → stable local id reused on second update", () => {
    const root = tmpProject();
    seedMinimalRun(root, "run-a");

    const first = buildDemo({ projectRoot: root, runId: "run-a" });
    assert.match(first.evidenceKey, /^local:[0-9a-f-]{36}$/i);
    const idFile = JSON.parse(
      fs.readFileSync(path.join(root, ".sdd/evidence-id.json"), "utf8"),
    );
    assert.equal(first.evidenceKey, `local:${idFile.id}`);

    write(
      root,
      ".sdd/runs/run-b/report.json",
      JSON.stringify({
        id: "run-b",
        startedAt: "2026-11-24T14:00:00.000Z",
        status: "failed",
        phases: [{ phase: "verify", status: "failed" }],
        diagnoseIterations: 1,
        runners: [{ name: "all", exitCode: 1 }],
      }),
    );

    const second = updateEvidencePack({
      projectRoot: root,
      runId: "run-b",
    });
    assert.equal(second.evidenceKey, first.evidenceKey);
    assert.equal(second.meta.lastRunId, "run-b");
    assert.equal(second.source, "evidence-id");

    // Same encoded directory
    assert.equal(
      path.basename(second.evidenceDir),
      encodeEvidenceKeyForPath(first.evidenceKey),
    );
  });
});
