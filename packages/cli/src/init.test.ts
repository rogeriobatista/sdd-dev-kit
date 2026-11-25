import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { pathExists } from "./fs-utils.js";
import { runInit } from "./commands/init.js";
import { runCli } from "./cli.js";

describe("sdd init", () => {
  const temps: string[] = [];

  after(async () => {
    for (const dir of temps) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  async function tempProject(): Promise<string> {
    const dir = await mkdtemp(path.join(os.tmpdir(), "sdd-cli-"));
    temps.push(dir);
    return dir;
  }

  it("dry-run reports planned writes without creating files", async () => {
    const root = await tempProject();
    const result = await runInit({
      projectRoot: root,
      host: "cursor",
      stack: "typescript",
      dryRun: true,
    });

    assert.equal(result.dryRun, true);
    assert.equal(result.stack, "typescript");
    assert.ok(result.written.some((w) => w.includes("dry-run")));
    assert.equal(await pathExists(path.join(root, "sdd.yaml")), false);
    assert.equal(await pathExists(path.join(root, ".cursor")), false);
  });

  it("scaffolds cursor host + typescript stack into a temp dir", async () => {
    const root = await tempProject();
    const result = await runInit({
      projectRoot: root,
      host: "cursor",
      stack: "typescript",
    });

    assert.equal(result.needsClarification, false);
    assert.equal(result.stack, "typescript");
    assert.equal(await pathExists(path.join(root, "sdd.yaml")), true);
    assert.equal(await pathExists(path.join(root, "specs", "_example.md")), true);
    assert.equal(await pathExists(path.join(root, ".sdd", "premises.md")), true);
    assert.equal(
      await pathExists(path.join(root, ".cursor", "skills", "sdd", "SKILL.md")),
      true,
    );
    assert.equal(
      await pathExists(path.join(root, ".cursor", "rules", "sdd-human-edits.mdc")),
      true,
    );
    assert.equal(await pathExists(path.join(root, ".sdd", "stack.json")), true);

    const premises = await readFile(
      path.join(root, ".sdd", "premises.md"),
      "utf8",
    );
    assert.match(premises, /adapter:\s*typescript/);

    const yaml = await readFile(path.join(root, "sdd.yaml"), "utf8");
    assert.match(yaml, /adapter:\s*typescript/);
  });

  it("does not overwrite existing human specs", async () => {
    const root = await tempProject();
    const specsDir = path.join(root, "specs");
    await import("node:fs/promises").then((m) =>
      m.mkdir(specsDir, { recursive: true }),
    );
    const custom = path.join(specsDir, "_example.md");
    await import("node:fs/promises").then((m) =>
      m.writeFile(custom, "# keep-me\n", "utf8"),
    );

    await runInit({
      projectRoot: root,
      host: "cursor",
      stack: "python",
    });

    const text = await readFile(custom, "utf8");
    assert.equal(text, "# keep-me\n");
  });

  it("cli --help exits 0", async () => {
    const prev = console.log;
    const lines: string[] = [];
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      const { exitCode } = await runCli(["node", "sdd", "--help"]);
      assert.equal(exitCode, 0);
      assert.ok(lines.join("\n").includes("sdd init"));
    } finally {
      console.log = prev;
    }
  });
});
