import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { createDefaultManifest } from "../schema.js";
import type { TicketPayload } from "../types.js";
import { fromTicket } from "./from-ticket.js";
import type { TicketProvider } from "./provider.js";

const fixtureTicket: TicketPayload = {
  id: "ENG-42",
  url: "https://linear.app/acme/issue/ENG-42",
  title: "Checkout — aplicar cupom",
  description: "Permitir cupom no checkout.",
  acceptanceCriteria: [
    "Dado um carrinho\nQuando aplica cupom\nEntão total reduz",
  ],
  labels: ["checkout"],
  provider: "linear",
};

describe("fromTicket", () => {
  const dirs: string[] = [];
  after(async () => {
    await Promise.all(
      dirs.map((d) => rm(d, { recursive: true, force: true })),
    );
  });

  it("writes draft specs + .sdd/ticket.json provenance", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "sdd-from-ticket-"));
    dirs.push(root);

    const fakeLinear: TicketProvider = {
      name: "linear",
      async fetch() {
        return fixtureTicket;
      },
    };

    const manifest = createDefaultManifest();
    manifest.ticketing = {
      defaultProvider: "linear",
      providers: {
        linear: { enabled: true, apiKeyEnv: "LINEAR_API_KEY" },
      },
    };

    const result = await fromTicket({
      projectRoot: root,
      ticketId: "ENG-42",
      manifest,
      providers: { linear: fakeLinear },
    });

    assert.equal(result.ticket.id, "ENG-42");
    assert.match(result.draftSpecPath, /^specs\//);
    assert.equal(result.provenancePath, ".sdd/ticket.json");

    const spec = await readFile(
      path.join(root, result.draftSpecPath),
      "utf8",
    );
    assert.match(spec, /Checkout — aplicar cupom/);
    assert.match(spec, /Dado um carrinho/);

    const provenanceRaw = await readFile(
      path.join(root, ".sdd/ticket.json"),
      "utf8",
    );
    const provenance = JSON.parse(provenanceRaw) as {
      ticket: TicketPayload;
      draftSpecPath: string;
      evidenceKey?: string;
      evidencePath?: string;
    };
    assert.equal(provenance.ticket.id, "ENG-42");
    assert.equal(provenance.draftSpecPath, result.draftSpecPath);
    assert.equal(provenance.evidenceKey, "linear:ENG-42");
    assert.equal(provenance.evidencePath, ".sdd/evidence/linear_ENG-42");
  });

  it("refuses to overwrite an existing draft without overwrite flag", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "sdd-from-ticket-"));
    dirs.push(root);

    const fakeLinear: TicketProvider = {
      name: "linear",
      async fetch() {
        return fixtureTicket;
      },
    };

    const manifest = createDefaultManifest();
    manifest.ticketing = {
      defaultProvider: "linear",
      providers: {},
    };

    await fromTicket({
      projectRoot: root,
      ticketId: "linear:ENG-42",
      manifest,
      providers: { linear: fakeLinear },
    });

    await assert.rejects(
      () =>
        fromTicket({
          projectRoot: root,
          ticketId: "linear:ENG-42",
          manifest,
          providers: { linear: fakeLinear },
        }),
      /already exists/,
    );
  });
});
