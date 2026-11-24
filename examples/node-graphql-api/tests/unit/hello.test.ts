import { describe, it, expect } from "vitest";
import { buildYoga } from "../../src/server.js";

describe("hello query", () => {
  it("returns Hello, Alice!", async () => {
    const yoga = buildYoga();
    const res = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `query ($name: String) { hello(name: $name) }`,
        variables: { name: "Alice" },
      }),
    });
    const body = await res.json();
    expect(body.data.hello).toBe("Hello, Alice!");
  });
});
