import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import {
  encodeBugIdForPath,
  listBugIds,
  resolveBugPaths,
} from "./paths.js";
import { ensureBugReport } from "./report.js";
import { DEFAULT_PATHS } from "../paths.js";

describe("bug paths", () => {
  const temps: string[] = [];

  after(async () => {
    for (const dir of temps) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("encodes colon ticket ids like evidence keys", () => {
    assert.equal(encodeBugIdForPath("linear:ENG-42"), "linear_ENG-42");
    assert.equal(encodeBugIdForPath("jira:SHOP-7"), "jira_SHOP-7");
  });

  it("resolves REPORT/DEBUG/QA under .sdd/bugs/<encoded>/", () => {
    const paths = resolveBugPaths("/tmp/proj", "linear:ENG-42");
    assert.equal(paths.encodedId, "linear_ENG-42");
    assert.equal(paths.bugPath, `${DEFAULT_PATHS.bugs}/linear_ENG-42`);
    assert.equal(paths.reportRel, ".sdd/bugs/linear_ENG-42/REPORT.md");
    assert.equal(paths.debugRel, ".sdd/bugs/linear_ENG-42/DEBUG.md");
    assert.equal(paths.qaRel, ".sdd/bugs/linear_ENG-42/QA.md");
    assert.equal(paths.evidenceKey, "linear:ENG-42");
    assert.equal(paths.evidenceEncodedKey, "linear_ENG-42");
  });

  it("ensureBugReport writes REPORT.md + meta.json and lists bugs", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sdd-bugs-"));
    temps.push(root);

    const first = ensureBugReport({
      projectRoot: root,
      bugId: "linear:ENG-42",
      title: "Cupom não aplica",
    });
    assert.equal(first.created, true);
    assert.equal(first.reportWritten, true);
    assert.equal(first.paths.bugId, "linear:ENG-42");
    assert.match(first.meta.evidenceKey, /linear:ENG-42/);

    const again = ensureBugReport({
      projectRoot: root,
      bugId: "linear:ENG-42",
    });
    assert.equal(again.created, false);
    assert.equal(again.reportWritten, false);

    const listed = listBugIds(root);
    assert.deepEqual(listed, ["linear_ENG-42"]);
  });
});
