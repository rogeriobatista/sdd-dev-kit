import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evidenceKeyForBug,
  newLocalBugId,
  parseBugId,
} from "./parse.js";

describe("parseBugId", () => {
  it("parses linear and jira prefixed ticket ids", () => {
    const linear = parseBugId("linear:ENG-42");
    assert.equal(linear.bugId, "linear:ENG-42");
    assert.equal(linear.kind, "ticket");
    assert.deepEqual(linear.ticket, { provider: "linear", id: "ENG-42" });

    const jira = parseBugId("jira:SHOP-7");
    assert.equal(jira.bugId, "jira:SHOP-7");
    assert.equal(jira.kind, "ticket");
    assert.deepEqual(jira.ticket, { provider: "jira", id: "SHOP-7" });
  });

  it("normalizes bare issue keys when defaultProvider is set", () => {
    const parsed = parseBugId("eng-42", { defaultProvider: "linear" });
    assert.equal(parsed.bugId, "linear:ENG-42");
    assert.equal(parsed.kind, "ticket");
  });

  it("rejects ambiguous bare issue keys without defaultProvider", () => {
    assert.throws(() => parseBugId("ENG-42"), /Ambiguous/);
  });

  it("accepts existing local bug ids and generates when empty", () => {
    const local = parseBugId("bug_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    assert.equal(local.kind, "local");
    assert.equal(local.bugId, "bug_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    const generated = parseBugId("");
    assert.equal(generated.kind, "local");
    assert.match(generated.bugId, /^bug_[0-9a-f-]{36}$/i);

    const fresh = newLocalBugId();
    assert.match(fresh, /^bug_[0-9a-f-]{36}$/i);
  });

  it("maps Linear UUID to linear: ticket form", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const parsed = parseBugId(id);
    assert.equal(parsed.bugId, `linear:${id}`);
    assert.equal(parsed.kind, "ticket");
  });

  it("aligns evidenceKey with bugId", () => {
    const parsed = parseBugId("linear:ENG-42");
    assert.equal(evidenceKeyForBug(parsed), "linear:ENG-42");
  });
});
