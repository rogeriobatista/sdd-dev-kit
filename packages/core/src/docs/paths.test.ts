import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOCS_FILES,
  DOCS_PACK_REL,
  adrRelPath,
  docsFileRelPath,
  docsPackRelPath,
  evidenceDemoRelPath,
} from "./paths.js";
import { fillTemplate, EMBEDDED_TEMPLATES } from "./templates.js";

describe("docs path helpers", () => {
  it("resolves docs/sdd pack and files", () => {
    assert.equal(DOCS_PACK_REL, "docs/sdd");
    assert.equal(docsPackRelPath(), "docs/sdd");
    assert.equal(docsFileRelPath(DOCS_FILES.product), "docs/sdd/PRODUCT.md");
    assert.equal(docsFileRelPath(DOCS_FILES.handoff), "docs/sdd/HANDOFF.md");
    assert.equal(adrRelPath(), "docs/sdd/ADR");
    assert.equal(
      adrRelPath("ADR 001 Auth choice"),
      "docs/sdd/ADR/adr-001-auth-choice.md",
    );
    assert.equal(
      evidenceDemoRelPath("linear_ENG-42"),
      ".sdd/evidence/linear_ENG-42/latest/demo/",
    );
  });

  it("fillTemplate replaces known keys and blanks unknown", () => {
    const out = fillTemplate("A={{FOO}} B={{BAR}}", { FOO: "x" });
    assert.equal(out, "A=x B=");
  });

  it("embedded templates cover stakeholder sections", () => {
    for (const key of [
      "readme",
      "product",
      "technical",
      "changelog",
      "handoff",
      "api",
      "adrIndex",
    ] as const) {
      assert.ok(
        EMBEDDED_TEMPLATES[key].length > 40,
        `${key} template should be non-empty`,
      );
    }
    assert.ok(EMBEDDED_TEMPLATES.product.includes("Intenção"));
    assert.ok(EMBEDDED_TEMPLATES.handoff.includes("PO / BO / QA"));
    assert.ok(EMBEDDED_TEMPLATES.technical.includes("Dev Spec"));
  });
});
