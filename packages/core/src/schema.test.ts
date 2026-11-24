import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDefaultManifest,
  parseSddYaml,
  safeParseSddYaml,
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

  it("rejects an unknown adapter", () => {
    const result = safeParseSddYaml(`
adapter: python
`);
    assert.equal(result.success, false);
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
