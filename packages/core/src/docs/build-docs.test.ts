import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildDocs } from "./build-docs.js";
import { parseSpecSections } from "./collect.js";

function write(file: string, body: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body, "utf8");
}

describe("buildDocs", () => {
  it("parseSpecSections extracts intenção/cenários without inventing", () => {
    const md = `# Spec\n\n## Intenção\n\nCupom de desconto.\n\n## Cenários\n\nDado um carrinho\nQuando aplico cupom\nEntão o total baixa\n`;
    const parsed = parseSpecSections(md);
    assert.equal(parsed.intention, "Cupom de desconto.");
    assert.ok(parsed.scenarios?.includes("Dado um carrinho"));
    assert.equal(parseSpecSections("# vazio").intention, null);
  });

  it("writes docs/sdd pack from specs without inventing features", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-docs-"));
    try {
      write(
        path.join(root, ".sdd", "premises.md"),
        "## Stack\n\ntypescript\n",
      );
      write(
        path.join(root, "specs", "cupom.md"),
        `## Intenção\n\nAplicar cupom no checkout.\n\n## Cenários\n\nDado um carrinho com itens\nQuando o usuário aplica CUPON10\nEntão o desconto aparece no total\n`,
      );
      write(
        path.join(root, ".sdd", "dev-spec.md"),
        "# Dev Spec\n\nEndpoint POST /checkout/coupon\n",
      );
      write(
        path.join(root, ".sdd", "design-approach.md"),
        "## Validação no backend\n\nValidar cupom no servidor.\n",
      );
      write(
        path.join(root, ".sdd", "implementation-plan.md"),
        "1. API stub\n2. UI\n",
      );
      write(
        path.join(root, "src", "index.ts"),
        'export function applyCoupon() {}\nexport const VERSION = "1";\n',
      );

      const result = buildDocs({ projectRoot: root, mode: "all" });
      assert.equal(result.docsPath, "docs/sdd");
      assert.ok(result.written.some((w) => w.endsWith("PRODUCT.md")));
      assert.ok(result.written.some((w) => w.endsWith("HANDOFF.md")));
      assert.ok(result.written.some((w) => w === "CHANGELOG.md"));

      const product = fs.readFileSync(
        path.join(root, "docs", "sdd", "PRODUCT.md"),
        "utf8",
      );
      assert.ok(product.includes("Aplicar cupom no checkout."));
      assert.ok(product.includes("Dado um carrinho"));
      assert.equal(product.includes("frete grátis"), false);

      const handoff = fs.readFileSync(
        path.join(root, "docs", "sdd", "HANDOFF.md"),
        "utf8",
      );
      assert.ok(handoff.includes(".sdd/evidence/"));
      assert.ok(handoff.includes("latest/demo"));

      const api = fs.readFileSync(
        path.join(root, "docs", "sdd", "API.md"),
        "utf8",
      );
      assert.ok(api.includes("applyCoupon"));

      const adrIndex = fs.readFileSync(
        path.join(root, "docs", "sdd", "ADR", "README.md"),
        "utf8",
      );
      assert.ok(adrIndex.includes("Validação no backend"));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("supports changelog-only mode", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-docs-cl-"));
    try {
      write(path.join(root, ".sdd", "premises.md"), "## Stack\n\npython\n");
      write(path.join(root, "specs", "a.md"), "## Intenção\n\nHello\n");
      write(
        path.join(root, ".sdd", "runs", "r1", "report.json"),
        JSON.stringify({ status: "pass", summary: "ok" }),
      );
      const result = buildDocs({ projectRoot: root, mode: "changelog" });
      assert.equal(result.mode, "changelog");
      assert.ok(result.written.some((w) => w.includes("CHANGELOG.md")));
      assert.equal(
        fs.existsSync(path.join(root, "docs", "sdd", "PRODUCT.md")),
        false,
      );
      const cl = fs.readFileSync(
        path.join(root, "docs", "sdd", "CHANGELOG.md"),
        "utf8",
      );
      assert.ok(cl.includes("r1"));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
