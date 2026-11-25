import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CanonicalScenario } from "@rogeriobatista/core";
import { usesCucumber, usesPlaywright } from "./tags.js";

function scenario(tags: CanonicalScenario["tags"]): CanonicalScenario {
  return {
    id: "x",
    title: "t",
    sourceFile: "specs/a.md",
    tags,
    steps: [],
  };
}

describe("tag routing", () => {
  it("routes untagged and @api to Cucumber", () => {
    assert.equal(usesCucumber(scenario([])), true);
    assert.equal(usesCucumber(scenario(["api"])), true);
    assert.equal(usesPlaywright(scenario(["api"])), false);
  });

  it("routes @ui and @e2e to Playwright", () => {
    assert.equal(usesPlaywright(scenario(["ui"])), true);
    assert.equal(usesPlaywright(scenario(["e2e"])), true);
    assert.equal(usesCucumber(scenario(["ui"])), false);
  });
});
