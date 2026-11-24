import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectProvider,
  parseTicketId,
  parseTicketRef,
} from "./detect.js";

describe("parseTicketId", () => {
  it("parses Linear UUID", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const parsed = parseTicketId(id);
    assert.equal(parsed.kind, "uuid");
    assert.equal(parsed.value, id);
  });

  it("parses issue keys and uppercases the project", () => {
    const parsed = parseTicketId("eng-42");
    assert.equal(parsed.kind, "issue-key");
    if (parsed.kind === "issue-key") {
      assert.equal(parsed.project, "ENG");
      assert.equal(parsed.number, "42");
      assert.equal(parsed.value, "ENG-42");
    }
  });

  it("rejects empty / garbage ids", () => {
    assert.throws(() => parseTicketId(""), /empty/i);
    assert.throws(() => parseTicketId("not a ticket"), /Unrecognized/);
  });
});

describe("parseTicketRef", () => {
  it("parses provider prefixes", () => {
    assert.deepEqual(parseTicketRef("linear:ENG-1"), {
      id: "ENG-1",
      provider: "linear",
    });
    assert.deepEqual(parseTicketRef("jira: SHOP-7"), {
      id: "SHOP-7",
      provider: "jira",
    });
  });

  it("returns bare id without provider", () => {
    assert.deepEqual(parseTicketRef("ENG-1"), { id: "ENG-1" });
  });
});

describe("detectProvider", () => {
  it("uses explicit provider", () => {
    assert.equal(
      detectProvider({ id: "ENG-1", provider: "jira" }),
      "jira",
    );
  });

  it("maps UUID to Linear", () => {
    assert.equal(
      detectProvider({ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }),
      "linear",
    );
  });

  it("uses defaultProvider for ambiguous keys", () => {
    assert.equal(
      detectProvider({ id: "ENG-1" }, { defaultProvider: "linear", providers: {} }),
      "linear",
    );
  });

  it("errors when key is ambiguous and no default", () => {
    assert.throws(
      () => detectProvider({ id: "ENG-1" }),
      /Ambiguous ticket id/,
    );
  });
});
