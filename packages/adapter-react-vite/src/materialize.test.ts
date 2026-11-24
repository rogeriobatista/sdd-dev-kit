import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createDefaultManifest, type CanonicalDocument } from "@sdd-dev-kit/core";
import { materializeCanonical } from "./materialize.js";

describe("adapter-react-vite materialize", () => {
  it("routes ui to playwright and api to vitest stubs", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "sdd-rv-"));
    try {
      const doc: CanonicalDocument = {
        sourceFile: "specs/home.md",
        featureTitle: "Home",
        scenarios: [
          {
            id: "home-ui",
            title: "Mostra hero",
            sourceFile: "specs/home.md",
            tags: ["ui"],
            steps: [{ keyword: "Quando", text: "abre a home" }],
          },
          {
            id: "home-api",
            title: "Calcula total",
            sourceFile: "specs/home.md",
            tags: ["api"],
            steps: [{ keyword: "Então", text: "total é 10" }],
          },
        ],
      };
      const manifest = {
        ...createDefaultManifest(),
        adapter: "react-vite" as const,
      };
      const result = await materializeCanonical(dir, manifest, [doc]);
      assert.equal(result.e2eFiles.length, 1);
      assert.equal(result.unitFiles.length, 1);
      const e2e = await readFile(result.e2eFiles[0]!, "utf8");
      assert.ok(e2e.includes("@playwright/test"));
      const unit = await readFile(result.unitFiles[0]!, "utf8");
      assert.ok(unit.includes("vitest"));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
