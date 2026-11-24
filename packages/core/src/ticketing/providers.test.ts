import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { JiraProvider, adfOrStringToText } from "./jira.js";
import { LinearProvider } from "./linear.js";
import { requireEnv } from "./provider.js";

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
);

async function loadFixture(name: string): Promise<unknown> {
  const raw = await readFile(path.join(fixturesDir, name), "utf8");
  return JSON.parse(raw) as unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("requireEnv", () => {
  it("reads named env vars and never invents secrets", () => {
    assert.equal(
      requireEnv("LINEAR_API_KEY", { LINEAR_API_KEY: " lin_test " }),
      "lin_test",
    );
    assert.throws(
      () => requireEnv("LINEAR_API_KEY", {}),
      /Missing required environment variable LINEAR_API_KEY/,
    );
  });
});

describe("LinearProvider", () => {
  it("maps GraphQL fixture to TicketPayload", async () => {
    const fixture = await loadFixture("linear-issue.json");
    let calledUrl = "";
    let auth = "";

    const provider = new LinearProvider({
      env: { LINEAR_API_KEY: "lin_test_key" },
      fetchImpl: async (input, init) => {
        calledUrl = String(input);
        auth = String(
          (init?.headers as Record<string, string>)?.Authorization ?? "",
        );
        return jsonResponse(fixture);
      },
    });

    const ticket = await provider.fetch({ id: "ENG-42" });
    assert.equal(calledUrl, "https://api.linear.app/graphql");
    assert.equal(auth, "lin_test_key");
    assert.equal(ticket.provider, "linear");
    assert.equal(ticket.id, "ENG-42");
    assert.equal(ticket.title, "Checkout — aplicar cupom");
    assert.match(ticket.description, /cupom percentual/);
    assert.ok(ticket.acceptanceCriteria.length >= 1);
    assert.deepEqual(ticket.labels, ["checkout", "api"]);
    assert.match(ticket.url, /ENG-42/);
  });

  it("surfaces GraphQL errors", async () => {
    const provider = new LinearProvider({
      env: { LINEAR_API_KEY: "lin_test_key" },
      fetchImpl: async () =>
        jsonResponse({ errors: [{ message: "Entity not found" }] }),
    });
    await assert.rejects(
      () => provider.fetch({ id: "ENG-404" }),
      /Entity not found/,
    );
  });
});

describe("JiraProvider", () => {
  it("maps REST fixture to TicketPayload with basic auth", async () => {
    const fixture = await loadFixture("jira-issue.json");
    let calledUrl = "";
    let auth = "";

    const provider = new JiraProvider({
      env: {
        JIRA_BASE_URL: "https://acme.atlassian.net",
        JIRA_EMAIL: "dev@acme.test",
        JIRA_API_TOKEN: "jira_token",
      },
      fetchImpl: async (input, init) => {
        calledUrl = String(input);
        auth = String(
          (init?.headers as Record<string, string>)?.Authorization ?? "",
        );
        return jsonResponse(fixture);
      },
    });

    const ticket = await provider.fetch({ id: "shop-7" });
    assert.match(calledUrl, /\/rest\/api\/3\/issue\/SHOP-7/);
    assert.match(auth, /^Basic /);
    assert.equal(ticket.provider, "jira");
    assert.equal(ticket.id, "SHOP-7");
    assert.equal(ticket.title, "Checkout — aplicar cupom");
    assert.match(ticket.description, /cupom percentual/);
    assert.ok(ticket.acceptanceCriteria.length >= 1);
    assert.deepEqual(ticket.labels, ["checkout", "ui"]);
    assert.equal(ticket.url, "https://acme.atlassian.net/browse/SHOP-7");
  });

  it("uses Bearer when email env is absent", async () => {
    const fixture = await loadFixture("jira-issue.json");
    let auth = "";
    const provider = new JiraProvider({
      env: {
        JIRA_BASE_URL: "https://acme.atlassian.net",
        JIRA_API_TOKEN: "pat_only",
      },
      fetchImpl: async (_input, init) => {
        auth = String(
          (init?.headers as Record<string, string>)?.Authorization ?? "",
        );
        return jsonResponse(fixture);
      },
    });
    await provider.fetch({ id: "SHOP-7" });
    assert.equal(auth, "Bearer pat_only");
  });

  it("throws on 404", async () => {
    const provider = new JiraProvider({
      env: {
        JIRA_BASE_URL: "https://acme.atlassian.net",
        JIRA_EMAIL: "dev@acme.test",
        JIRA_API_TOKEN: "jira_token",
      },
      fetchImpl: async () => jsonResponse({ error: "missing" }, 404),
    });
    await assert.rejects(
      () => provider.fetch({ id: "SHOP-404" }),
      /not found/i,
    );
  });
});

describe("adfOrStringToText", () => {
  it("flattens ADF paragraphs and lists", () => {
    const text = adfOrStringToText({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item A" }],
                },
              ],
            },
          ],
        },
      ],
    });
    assert.match(text, /Hello/);
    assert.match(text, /- Item A/);
  });
});
