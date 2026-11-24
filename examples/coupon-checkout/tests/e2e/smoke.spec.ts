import { test, expect } from "@playwright/test";
import http from "node:http";
import type { AddressInfo } from "node:net";

test("smoke UI body is visible", async ({ page }) => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("<!doctype html><html><body><h1>SDD smoke</h1></body></html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await page.goto(`http://127.0.0.1:${port}/`);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: "SDD smoke" })).toBeVisible();
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
});
