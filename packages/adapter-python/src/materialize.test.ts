import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createDefaultManifest, type CanonicalDocument } from "@rogeriobatista/core";
import { materializeCanonical } from "./materialize.js";

describe("adapter-python materialize", () => {
  it("writes pytest stubs from canonical scenarios", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "sdd-py-"));
    try {
      const doc: CanonicalDocument = {
        sourceFile: "specs/hello.md",
        featureTitle: "Hello",
        intention: "cumprimentar",
        scenarios: [
          {
            id: "hello-1",
            title: "Diz oi",
            sourceFile: "specs/hello.md",
            tags: ["api"],
            steps: [
              { keyword: "Dado", text: "um nome" },
              { keyword: "Quando", text: "cumprimenta" },
              { keyword: "Então", text: "responde oi" },
            ],
          },
        ],
      };
      const manifest = { ...createDefaultManifest(), adapter: "python" as const };
      const result = await materializeCanonical(dir, manifest, [doc]);
      assert.equal(result.testFiles.length, 1);
      const body = await readFile(result.testFiles[0]!, "utf8");
      assert.ok(body.includes("def test_diz_oi"));
      assert.ok(body.includes("# Dado um nome"));
      assert.ok(body.includes("pytest.fail"));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
