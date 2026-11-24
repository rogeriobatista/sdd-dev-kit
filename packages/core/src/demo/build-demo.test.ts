import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildDemo } from "./build-demo.js";
import { scrubSecrets } from "./secrets.js";
import {
  parseCucumberJson,
  parseJunitXml,
  parseSpecMarkdown,
} from "./scenarios.js";

function tmpProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sdd-demo-"));
}

function write(root: string, rel: string, contents: string | Buffer): void {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

describe("scrubSecrets", () => {
  it("redacts bearer tokens and api keys", () => {
    const raw =
      'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb api_key=supersecretvalue123';
    const out = scrubSecrets(raw);
    assert.ok(!out.includes("supersecretvalue123"));
    assert.ok(out.includes("[REDACTED]"));
  });
});

describe("parseSpecMarkdown", () => {
  it("extracts intention, scenarios and Portuguese steps", () => {
    const md = `# Checkout

## Intenção
Aplicar cupom no carrinho.

## Cenários

### Cupom válido @api
Dado um carrinho com total 100
Quando o usuário aplica o cupom
Então o total deve ser 90
`;
    const feature = parseSpecMarkdown(md, "checkout.md");
    assert.equal(feature.title, "Checkout");
    assert.match(feature.intention ?? "", /cupom/i);
    assert.equal(feature.scenarios.length, 1);
    assert.equal(feature.scenarios[0]!.title, "Cupom válido");
    assert.deepEqual(feature.scenarios[0]!.tags, ["api"]);
    assert.equal(feature.scenarios[0]!.steps.length, 3);
    assert.equal(feature.scenarios[0]!.steps[0]!.keyword, "Dado");
  });
});

describe("parseCucumberJson / parseJunitXml", () => {
  it("maps cucumber scenario status", () => {
    const raw = [
      {
        elements: [
          {
            name: "Cupom válido",
            steps: [
              { result: { status: "passed" } },
              { result: { status: "passed" } },
            ],
          },
          {
            name: "Cupom expirado",
            steps: [
              {
                result: {
                  status: "failed",
                  error_message: "token=abc123secret",
                },
              },
            ],
          },
        ],
      },
    ];
    const parsed = parseCucumberJson(raw);
    assert.equal(parsed.overall, "failed");
    const ok = [...parsed.byKey.entries()].find(([k]) =>
      k.includes("cupom valido"),
    );
    assert.equal(ok?.[1].status, "passed");
    const fail = [...parsed.byKey.entries()].find(([k]) =>
      k.includes("cupom expirado"),
    );
    assert.equal(fail?.[1].status, "failed");
    assert.ok(fail?.[1].detail?.includes("[REDACTED]"));
  });

  it("maps junit testcase status", () => {
    const xml = `<?xml version="1.0"?>
<testsuite>
  <testcase classname="tests.test_hello" name="test_hello_ok"/>
  <testcase classname="tests.test_hello" name="test_hello_fail">
    <failure message="assertion failed"/>
  </testcase>
</testsuite>`;
    const parsed = parseJunitXml(xml);
    assert.equal(parsed.overall, "failed");
    assert.equal(
      [...parsed.byKey.values()].filter((v) => v.status === "passed").length >=
        1,
      true,
    );
  });
});

describe("buildDemo", () => {
  it("builds stakeholder pack from run report + specs + cucumber evidence", () => {
    const root = tmpProject();
    write(
      root,
      "specs/checkout.md",
      `# Checkout — aplicar cupom

## Intenção
Permitir aplicar um cupom percentual no carrinho.

## Cenários

### Cupom válido reduz o total @api
Dado um carrinho com total 100
Quando o usuário aplica o cupom
Então o total deve ser 90

### Cupom na tela @ui
Dado que o usuário está no checkout
Quando informa o cupom
Então a tela mostra total 90
`,
    );
    write(
      root,
      ".sdd/runs/run-001/report.json",
      JSON.stringify({
        id: "run-001",
        startedAt: "2026-11-24T12:00:00.000Z",
        finishedAt: "2026-11-24T12:05:00.000Z",
        status: "passed",
        phases: [{ phase: "verify", status: "passed" }],
        diagnoseIterations: 0,
        runners: [
          { name: "cucumber", exitCode: 0 },
          { name: "playwright", exitCode: 0 },
        ],
      }),
    );
    write(
      root,
      "reports/cucumber.json",
      JSON.stringify([
        {
          elements: [
            {
              name: "Cupom válido reduz o total",
              steps: [{ result: { status: "passed" } }],
            },
          ],
        },
      ]),
    );
    // Tiny PNG-like evidence file
    write(root, "test-results/checkout/shot.png", Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const result = buildDemo({ projectRoot: root, runId: "run-001" });

    assert.equal(result.runId, "run-001");
    assert.ok(fs.existsSync(result.indexHtmlPath));
    assert.ok(fs.existsSync(result.summaryMdPath));
    assert.ok(fs.existsSync(result.manifestPath));

    const html = fs.readFileSync(result.indexHtmlPath, "utf8");
    assert.match(html, /PO \/ BO \/ QA/);
    assert.match(html, /Permitir aplicar um cupom/);
    assert.match(html, /Cupom válido reduz o total/);
    assert.match(html, /Dado/);
    assert.ok(!html.includes("api_key="));

    const summary = fs.readFileSync(result.summaryMdPath, "utf8");
    assert.match(summary, /Status geral/);
    assert.match(summary, /linguagem de negócio/i);

    const manifest = JSON.parse(fs.readFileSync(result.manifestPath, "utf8"));
    assert.equal(manifest.version, 1);
    assert.equal(manifest.runId, "run-001");
    assert.ok(manifest.features.length >= 1);
    assert.ok(
      manifest.evidence.some(
        (e: { kind: string }) => e.kind === "cucumber-json",
      ),
    );
    assert.ok(
      manifest.evidence.some((e: { kind: string }) => e.kind === "screenshot"),
    );
    // Evidence copied into pack
    assert.ok(
      manifest.evidence.every((e: { path: string }) =>
        e.path.startsWith("evidence/") || e.path.includes(".."),
      ),
    );
  });

  it("still produces narrative when evidence is missing", () => {
    const root = tmpProject();
    write(
      root,
      "specs/hello.md",
      `# Hello

## Intenção
Dizer olá.

## Cenários

### Mostra título @ui
Dado que a app está aberta
Então vê Hello
`,
    );
    write(
      root,
      ".sdd/runs/empty-run/report.json",
      JSON.stringify({
        id: "empty-run",
        startedAt: "2026-11-24T12:00:00.000Z",
        status: "failed",
        phases: [{ phase: "verify", status: "failed" }],
        diagnoseIterations: 1,
        runners: [{ name: "all", exitCode: 1, stderr: "api_key=should-not-leak" }],
      }),
    );

    const result = buildDemo({ projectRoot: root, runId: "empty-run" });
    const html = fs.readFileSync(result.indexHtmlPath, "utf8");
    assert.match(html, /Dizer olá/);
    assert.match(html, /Mostra título/);
    assert.ok(!html.includes("should-not-leak"));
    assert.ok(result.missingEvidence.length > 0);
  });

  it("defaults to latest run when runId omitted", () => {
    const root = tmpProject();
    write(root, "specs/a.md", "# A\n\n## Intenção\nx\n\n### S\nDado a\n");
    const olderDir = path.join(root, ".sdd/runs/older");
    const newerDir = path.join(root, ".sdd/runs/newer");
    write(
      root,
      ".sdd/runs/older/report.json",
      JSON.stringify({
        id: "older",
        startedAt: "2026-01-01T00:00:00.000Z",
        status: "passed",
        phases: [],
        diagnoseIterations: 0,
      }),
    );
    write(
      root,
      ".sdd/runs/newer/report.json",
      JSON.stringify({
        id: "newer",
        startedAt: "2026-11-24T00:00:00.000Z",
        status: "passed",
        phases: [],
        diagnoseIterations: 0,
      }),
    );
    // Explicit mtimes — Windows can collapse create times within the same second
    const oldTime = new Date("2020-01-01T00:00:00.000Z");
    const newTime = new Date("2026-11-24T12:00:00.000Z");
    fs.utimesSync(olderDir, oldTime, oldTime);
    fs.utimesSync(path.join(olderDir, "report.json"), oldTime, oldTime);
    fs.utimesSync(newerDir, newTime, newTime);
    fs.utimesSync(path.join(newerDir, "report.json"), newTime, newTime);

    const result = buildDemo({ projectRoot: root });
    assert.equal(result.runId, "newer");
  });
});
