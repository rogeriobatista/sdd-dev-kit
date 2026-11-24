import { test, expect } from "@playwright/test";

test("Cupom válido aparece na tela de checkout", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cupom").fill("PROMO10");
  await page.getByRole("button", { name: "Aplicar cupom" }).click();
  await expect(page.locator("#total")).toHaveText("90");
  await expect(page.locator("#receipt")).toContainText("Desconto");
});

test("Cupom expirado mostra erro na tela", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cupom").fill("OLD10");
  await page.getByRole("button", { name: "Aplicar cupom" }).click();
  await expect(page.locator("#total")).toHaveText("100");
  await expect(page.locator("#message")).toContainText(/expirado/i);
});
