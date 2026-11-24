import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { buildYoga } from "../../src/server.js";

Given("que a API GraphQL está pronta", async function () {
  this.yoga = buildYoga();
});

When(
  "consulto hello com nome {string}",
  async function (name: string) {
    const res = await this.yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `query ($name: String) { hello(name: $name) }`,
        variables: { name },
      }),
    });
    this.body = await res.json();
  },
);

Then("a resposta é {string}", async function (expected: string) {
  assert.equal(this.body.data.hello, expected);
});
