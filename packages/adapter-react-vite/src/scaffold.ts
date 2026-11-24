import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDefaultManifest,
  DEFAULT_PATHS,
  resolveSddPath,
  type SddManifest,
} from "@sdd-dev-kit/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../templates");

function manifestToYaml(manifest: SddManifest): string {
  return [
    `version: ${Number(manifest.version) || 1}`,
    `adapter: ${manifest.adapter}`,
    `paths:`,
    ...Object.entries(manifest.paths).map(([k, v]) => `  ${k}: ${v}`),
    `runners:`,
    ...Object.entries(manifest.runners).map(
      ([k, v]) => `  ${k}: ${JSON.stringify(v)}`,
    ),
    `triggers:`,
    `  watch: ${manifest.triggers.watch}`,
    `  command: ${JSON.stringify(manifest.triggers.command)}`,
    `loop:`,
    `  maxDiagnoseIterations: ${manifest.loop.maxDiagnoseIterations}`,
    ``,
  ].join("\n");
}

export interface ScaffoldOptions {
  projectRoot: string;
  manifest?: Partial<SddManifest>;
  includeSmokeFixtures?: boolean;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(filePath: string, contents: string): Promise<void> {
  if (await exists(filePath)) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

const PLAYWRIGHT_CONFIG = `import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.SDD_BASE_URL ?? "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: process.env.SDD_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 5173",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
`;

const VITE_CONFIG = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173 },
});
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SDD React Vite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX = `import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
`;

const APP_TSX = `export function App() {
  return (
    <main>
      <h1>SDD React + Vite</h1>
      <p>Edit specs/ then run the SDD pipeline.</p>
    </main>
  );
}
`;

const SMOKE_E2E = `import { test, expect } from "@playwright/test";

test("smoke UI body is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});
`;

export async function scaffoldProject(
  options: ScaffoldOptions,
): Promise<SddManifest> {
  const { projectRoot } = options;
  const base = createDefaultManifest();
  const manifest = {
    ...base,
    ...options.manifest,
    adapter: "react-vite" as const,
    paths: { ...base.paths, ...(options.manifest?.paths ?? {}) },
    runners: {
      ...base.runners,
      playwright: "npm run sdd:verify:playwright",
      all: "npm run sdd:verify:all",
      ...(options.manifest?.runners ?? {}),
    },
    triggers: { ...base.triggers, ...(options.manifest?.triggers ?? {}) },
    loop: { ...base.loop, ...(options.manifest?.loop ?? {}) },
  } satisfies SddManifest;

  for (const rel of [
    manifest.paths.specs,
    path.dirname(manifest.paths.premises),
    manifest.paths.canonical,
    manifest.paths.plan,
    manifest.paths.runs,
    manifest.paths.e2e,
    "tests/unit",
    manifest.paths.src,
  ]) {
    await mkdir(resolveSddPath(projectRoot, rel), { recursive: true });
  }

  await writeIfMissing(
    resolveSddPath(projectRoot, DEFAULT_PATHS.manifest),
    manifestToYaml(manifest),
  );
  await writeIfMissing(path.join(projectRoot, "playwright.config.ts"), PLAYWRIGHT_CONFIG);
  await writeIfMissing(path.join(projectRoot, "vite.config.ts"), VITE_CONFIG);
  await writeIfMissing(path.join(projectRoot, "index.html"), INDEX_HTML);
  await writeIfMissing(path.join(projectRoot, "src", "main.tsx"), MAIN_TSX);
  await writeIfMissing(path.join(projectRoot, "src", "App.tsx"), APP_TSX);

  if (options.includeSmokeFixtures !== false) {
    await writeIfMissing(
      path.join(resolveSddPath(projectRoot, manifest.paths.e2e), "smoke.spec.ts"),
      SMOKE_E2E,
    );
  }

  const readme = path.join(TEMPLATES_DIR, "README.scaffold.md");
  if (await exists(readme)) {
    const dest = path.join(projectRoot, ".sdd", "ADAPTER_REACT_VITE.md");
    if (!(await exists(dest))) {
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(readme, dest);
    }
  }

  return manifest;
}

export const SCAFFOLD_PACKAGE_SCRIPTS = {
  setup: "npm install && npx playwright install chromium",
  dev: "vite",
  build: "vite build",
  "sdd:verify:playwright": "playwright test",
  "sdd:verify:all": "npm run sdd:verify:playwright",
} as const;
