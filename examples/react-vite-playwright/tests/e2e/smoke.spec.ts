import { test, expect } from "@playwright/test";

test("shows Hello SDD", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hello SDD" })).toBeVisible();
});
