import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createDefaultManifest, type CanonicalDocument } from "@sdd-dev-kit/core";
import { materializeCanonical } from "./materialize.js";

describe("adapter-terraform materialize", () => {
  it("writes tftest stubs with GWT comments", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "sdd-tf-"));
    try {
      const doc: CanonicalDocument = {
        sourceFile: "specs/module.md",
        featureTitle: "Module",
        scenarios: [
          {
            id: "m1",
            title: "Greeting default",
            sourceFile: "specs/module.md",
            tags: ["api"],
            steps: [
              { keyword: "Dado", text: "um módulo local" },
              { keyword: "Então", text: "greeting é hello" },
            ],
          },
        ],
      };
      const manifest = {
        ...createDefaultManifest(),
        adapter: "terraform" as const,
      };
      const result = await materializeCanonical(dir, manifest, [doc]);
      assert.equal(result.testFiles.length, 1);
      const body = await readFile(result.testFiles[0]!, "utf8");
      assert.ok(body.includes('run "greeting_default"'));
      assert.ok(body.includes("# Dado um módulo local"));
      assert.ok(body.includes("command = plan"));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
