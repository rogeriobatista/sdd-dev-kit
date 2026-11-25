import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDefaultManifest,
  parseSddYaml,
  safeParseSddYaml,
  STACK_ADAPTER_IDS,
} from "./schema.js";
import { DEFAULT_MAX_DIAGNOSE_ITERATIONS } from "./phases.js";
import { DEFAULT_PATHS } from "./paths.js";

describe("SddManifestSchema", () => {
  it("creates a default manifest with watch false and loop cap 3", () => {
    const manifest = createDefaultManifest();
    assert.equal(manifest.version, "1");
    assert.equal(manifest.adapter, "typescript");
    assert.equal(manifest.triggers.watch, false);
    assert.equal(manifest.triggers.command, "/sdd run");
    assert.equal(
      manifest.loop.maxDiagnoseIterations,
      DEFAULT_MAX_DIAGNOSE_ITERATIONS,
    );
    assert.equal(manifest.paths.specs, DEFAULT_PATHS.specs);
    assert.equal(manifest.paths.features, DEFAULT_PATHS.features);
    assert.equal(manifest.paths.devSpec, DEFAULT_PATHS.devSpec);
    assert.equal(
      manifest.paths.implementationPlan,
      DEFAULT_PATHS.implementationPlan,
    );
    assert.equal(manifest.paths.designApproach, DEFAULT_PATHS.designApproach);
    assert.equal(manifest.paths.unit, DEFAULT_PATHS.unit);
    assert.equal(manifest.paths.integration, DEFAULT_PATHS.integration);
    assert.equal(manifest.runners.cucumber, "npm run sdd:verify:cucumber");
  });

  it("parses a valid YAML manifest and fills defaults", () => {
    const yaml = `
version: 1
adapter: typescript
triggers:
  watch: false
paths:
  specs: specs
runners:
  all: npm run sdd:verify:all
`;
    const manifest = parseSddYaml(yaml);
    assert.equal(manifest.adapter, "typescript");
    assert.equal(manifest.triggers.watch, false);
    assert.equal(manifest.paths.e2e, DEFAULT_PATHS.e2e);
    assert.equal(manifest.loop.maxDiagnoseIterations, 3);
  });

  it("accepts ts as an alias for typescript", () => {
    const manifest = parseSddYaml(`adapter: ts`);
    assert.equal(manifest.adapter, "typescript");
  });

  it("accepts first-class stack adapter ids", () => {
    for (const id of [
      "python",
      "react-vite",
      "node-graphql",
      "terraform",
    ] as const) {
      const manifest = parseSddYaml(`adapter: ${id}`);
      assert.equal(manifest.adapter, id);
    }
  });

  it("prefers adapters.stack over top-level adapter", () => {
    const yaml = `
adapter: typescript
adapters:
  stack: python
  hosts: [cursor, claude]
`;
    const manifest = parseSddYaml(yaml);
    assert.equal(manifest.adapter, "python");
    assert.deepEqual(manifest.adapters?.hosts, ["cursor", "claude"]);
  });

  it("allows stack-specific runner keys", () => {
    const yaml = `
adapter: python
runners:
  all: pytest
  pytest: pytest -q
  fmt: ruff format --check .
`;
    const manifest = parseSddYaml(yaml);
    assert.equal(manifest.runners.all, "pytest");
    assert.equal(manifest.runners.pytest, "pytest -q");
    assert.equal(manifest.runners.fmt, "ruff format --check .");
  });

  it("rejects an unknown adapter", () => {
    const result = safeParseSddYaml(`
adapter: cobol
`);
    assert.equal(result.success, false);
  });

  it("lists expected stack adapter id inputs", () => {
    assert.ok(STACK_ADAPTER_IDS.includes("python"));
    assert.ok(STACK_ADAPTER_IDS.includes("react-vite"));
    assert.ok(STACK_ADAPTER_IDS.includes("node-graphql"));
    assert.ok(STACK_ADAPTER_IDS.includes("terraform"));
    assert.ok(STACK_ADAPTER_IDS.includes("typescript"));
    assert.ok(STACK_ADAPTER_IDS.includes("ts"));
  });

  it("rejects non-positive diagnose iterations", () => {
    const result = safeParseSddYaml(`
loop:
  maxDiagnoseIterations: 0
`);
    assert.equal(result.success, false);
  });

  it("rejects a YAML list root", () => {
    const result = safeParseSddYaml(`- not: a mapping`);
    assert.equal(result.success, false);
  });

  it("parses optional ticketing section with env var names (no secrets)", () => {
    const yaml = `
version: 1
adapter: typescript
ticketing:
  defaultProvider: linear
  providers:
    linear:
      enabled: true
      apiKeyEnv: LINEAR_API_KEY
      defaultTeam: ENG
    jira:
      enabled: true
      baseUrlEnv: JIRA_BASE_URL
      emailEnv: JIRA_EMAIL
      apiTokenEnv: JIRA_API_TOKEN
      defaultProject: SHOP
      fieldMapping:
        acceptanceCriteria: customfield_10000
`;
    const manifest = parseSddYaml(yaml);
    assert.equal(manifest.ticketing?.defaultProvider, "linear");
    assert.equal(
      manifest.ticketing?.providers.linear?.apiKeyEnv,
      "LINEAR_API_KEY",
    );
    assert.equal(
      manifest.ticketing?.providers.jira?.fieldMapping?.acceptanceCriteria,
      "customfield_10000",
    );
    assert.equal(manifest.ticketing?.providers.jira?.defaultProject, "SHOP");
  });

  it("allows omitting ticketing entirely", () => {
    const manifest = createDefaultManifest();
    assert.equal(manifest.ticketing, undefined);
  });
});
