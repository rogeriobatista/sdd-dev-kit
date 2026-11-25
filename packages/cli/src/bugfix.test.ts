import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { pathExists } from "./fs-utils.js";
import {
  runBugReportCommand,
  runFixCommand,
  runReproduceCommand,
} from "./commands/bugfix.js";
import { runCli } from "./cli.js";

describe("sdd bugfix CLI", () => {
  const temps: string[] = [];

  after(async () => {
    for (const dir of temps) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  async function tempProject(): Promise<string> {
    const dir = await mkdtemp(path.join(os.tmpdir(), "sdd-bugfix-"));
    temps.push(dir);
    return dir;
  }

  it("bug-report creates REPORT.md and meta under .sdd/bugs/", async () => {
    const root = await tempProject();
    const result = await runBugReportCommand({
      projectRoot: root,
      bugId: "linear:ENG-42",
      title: "Falha no checkout",
    });
    assert.equal(result.paths.bugId, "linear:ENG-42");
    assert.equal(
      await pathExists(path.join(root, ".sdd", "bugs", "linear_ENG-42", "REPORT.md")),
      true,
    );
    const meta = JSON.parse(
      await readFile(
        path.join(root, ".sdd", "bugs", "linear_ENG-42", "meta.json"),
        "utf8",
      ),
    ) as { evidenceKey: string };
    assert.equal(meta.evidenceKey, "linear:ENG-42");
  });

  it("fix is blocked without regressionTest", async () => {
    const root = await tempProject();
    await runBugReportCommand({
      projectRoot: root,
      bugId: "linear:ENG-99",
    });
    const fix = await runFixCommand({
      projectRoot: root,
      bugId: "linear:ENG-99",
    });
    assert.equal(fix.blocked, true);
    assert.match(fix.guidance, /BLOCKED|reproduce/i);
  });

  it("reproduce guidance runs after report; cli bug-report exit 0", async () => {
    const root = await tempProject();
    await runBugReportCommand({ projectRoot: root, bugId: "jira:SHOP-7" });
    const repro = await runReproduceCommand({
      projectRoot: root,
      bugId: "jira:SHOP-7",
    });
    assert.match(repro.guidance, /failing/i);

    const { exitCode } = await runCli([
      "node",
      "sdd",
      "bug-report",
      "linear:CLI-1",
      "--cwd",
      root,
    ]);
    assert.equal(exitCode, 0);
  });

  it("fix proceeds when regressionTest is set", async () => {
    const root = await tempProject();
    await runBugReportCommand({ projectRoot: root, bugId: "linear:ENG-1" });
    const metaPath = path.join(
      root,
      ".sdd",
      "bugs",
      "linear_ENG-1",
      "meta.json",
    );
    const meta = JSON.parse(await readFile(metaPath, "utf8")) as Record<
      string,
      unknown
    >;
    meta.regressionTest = "tests/features/bug-eng-1.feature";
    await mkdir(path.dirname(metaPath), { recursive: true });
    await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
    const fix = await runFixCommand({
      projectRoot: root,
      bugId: "linear:ENG-1",
    });
    assert.equal(fix.blocked, false);
    assert.match(fix.guidance, /implement loop/i);
  });
});
