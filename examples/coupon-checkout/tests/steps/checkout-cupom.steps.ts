import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { applyCoupon, type Cart, type Coupon } from "../../src/coupon.js";

type World = {
  cart?: Cart;
  coupon?: Coupon;
  result?: ReturnType<typeof applyCoupon>;
};

Given("um carrinho com total {int}", async function (this: World, total: number) {
  this.cart = { total };
});

Given(
  "um cupom {string} de {int}% válido",
  async function (this: World, code: string, percent: number) {
    this.coupon = {
      code,
      percentOff: percent,
      expiresAt: new Date(Date.now() + 86_400_000),
    };
  },
);

Given("um cupom {string} expirado", async function (this: World, code: string) {
  this.coupon = {
    code,
    percentOff: 10,
    expiresAt: new Date(Date.now() - 86_400_000),
  };
});

When("o usuário aplica o cupom", async function (this: World) {
  assert.ok(this.cart && this.coupon);
  this.result = applyCoupon(this.cart, this.coupon);
});

Then("o total deve ser {int}", async function (this: World, expected: number) {
  assert.equal(this.result?.total, expected);
});

Then("o total permanece {int}", async function (this: World, expected: number) {
  assert.equal(this.result?.total, expected);
});

Then("o recibo deve mostrar o desconto aplicado", async function (this: World) {
  assert.ok(this.result?.receiptLine);
  assert.match(this.result.receiptLine, /Desconto/);
});

Then("uma mensagem de erro clara é retornada", async function (this: World) {
  assert.ok(this.result?.error);
  assert.match(this.result.error, /expirado|inválido|não encontrado/i);
});
