import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TicketPayload } from "../types.js";
import {
  draftSpecFileName,
  extractAcceptanceCriteriaFromText,
  mapTicketToSpecMarkdown,
} from "./map-to-spec.js";

const sample: TicketPayload = {
  id: "ENG-42",
  url: "https://linear.app/acme/issue/ENG-42",
  title: "Checkout — aplicar cupom",
  description:
    "Permitir aplicar um cupom percentual no carrinho antes do pagamento.",
  acceptanceCriteria: [
    [
      "Dado um carrinho com total 100",
      'E um cupom "PROMO10" de 10% válido',
      "Quando o usuário aplica o cupom",
      "Então o total deve ser 90",
    ].join("\n"),
    "Cupom expirado é rejeitado e o total permanece 100",
  ],
  labels: ["checkout", "api"],
  provider: "linear",
};

describe("mapTicketToSpecMarkdown", () => {
  it("produces Portuguese prosa + GWT draft with provenance", () => {
    const md = mapTicketToSpecMarkdown(sample);
    assert.match(md, /^# Checkout — aplicar cupom/m);
    assert.match(md, /Provenance: linear `ENG-42`/);
    assert.match(md, /## Intenção/);
    assert.match(md, /cupom percentual/);
    assert.match(md, /## Critérios de aceite/);
    assert.match(md, /## Cenários/);
    assert.match(md, /Dado um carrinho com total 100/);
    assert.match(md, /Quando o usuário aplica o cupom/);
    assert.match(md, /Então o total deve ser 90/);
    assert.match(md, /Critério 2/);
    assert.doesNotMatch(md, /invented secret rule/i);
  });

  it("asks for enrichment when AC is missing", () => {
    const md = mapTicketToSpecMarkdown({
      ...sample,
      acceptanceCriteria: [],
    });
    assert.match(md, /sem critérios de aceite/i);
    assert.match(md, /enriquecer/i);
  });

  it("does not invent extra acceptance criteria", () => {
    const md = mapTicketToSpecMarkdown({
      ...sample,
      acceptanceCriteria: ["Apenas este critério"],
    });
    assert.equal(
      (md.match(/### /g) ?? []).length,
      1,
      "only one scenario from one AC item",
    );
  });
});

describe("draftSpecFileName", () => {
  it("includes ticket id and slug", () => {
    const name = draftSpecFileName(sample);
    assert.match(name, /^eng-42-/);
    assert.match(name, /\.md$/);
  });
});

describe("extractAcceptanceCriteriaFromText", () => {
  it("pulls bullets under an Acceptance Criteria heading", () => {
    const text = `
Intro paragraph.

## Acceptance Criteria

- First criterion
- Second criterion

## Other
- ignore me unless no AC section? wait we stop at next heading
`;
    const ac = extractAcceptanceCriteriaFromText(text);
    assert.deepEqual(ac, ["First criterion", "Second criterion"]);
  });

  it("falls back to all bullets when no AC section", () => {
    const ac = extractAcceptanceCriteriaFromText("- only bullet\n");
    assert.deepEqual(ac, ["only bullet"]);
  });
});
