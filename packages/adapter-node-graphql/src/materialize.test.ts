import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createDefaultManifest, type CanonicalDocument } from "@sdd-dev-kit/core";
import { materializeCanonical } from "./materialize.js";

describe("adapter-node-graphql materialize", () => {
  it("writes cucumber + vitest stubs for @api", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "sdd-gql-"));
    try {
      const doc: CanonicalDocument = {
        sourceFile: "specs/hello.md",
        featureTitle: "Hello",
        scenarios: [
          {
            id: "h1",
            title: "Query hello",
            sourceFile: "specs/hello.md",
            tags: ["api"],
            steps: [
              { keyword: "Quando", text: "consulto hello" },
              { keyword: "Então", text: "recebo Hello" },
            ],
          },
        ],
      };
      const manifest = {
        ...createDefaultManifest(),
        adapter: "node-graphql" as const,
      };
      const result = await materializeCanonical(dir, manifest, [doc]);
      assert.equal(result.featureFiles.length, 1);
      assert.equal(result.stepFiles.length, 1);
      assert.equal(result.unitFiles.length, 1);
      const feature = await readFile(result.featureFiles[0]!, "utf8");
      assert.ok(feature.includes("@api"));
      assert.ok(feature.includes("Cenário: Query hello"));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
