import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";

Given("que o ambiente de teste está pronto", async function () {
  this.ready = true;
});

When("o smoke do kit é executado", async function () {
  this.ok = this.ready === true;
});

Then("o resultado deve ser sucesso", async function () {
  assert.equal(this.ok, true);
});
