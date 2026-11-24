import { mkdir, writeFile, copyFile, access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDefaultManifest,
  DEFAULT_PATHS,
  resolveSddPath,
  type SddManifest,
} from "@sdd-dev-kit/core";

function manifestToYaml(manifest: SddManifest): string {
  return [
    `version: ${Number(manifest.version) || 1}`,
    `adapter: ${manifest.adapter}`,
    `paths:`,
    ...Object.entries(manifest.paths).map(([k, v]) => `  ${k}: ${v}`),
    `runners:`,
    ...Object.entries(manifest.runners).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`),
    `triggers:`,
    `  watch: ${manifest.triggers.watch}`,
    `  command: ${JSON.stringify(manifest.triggers.command)}`,
    `loop:`,
    `  maxDiagnoseIterations: ${manifest.loop.maxDiagnoseIterations}`,
    ``,
  ].join("\n");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../templates");

export interface ScaffoldOptions {
  projectRoot: string;
  /** Merge over defaults. */
  manifest?: Partial<SddManifest>;
  /** Skip writing package.json if true. */
  skipPackageJson?: boolean;
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

const CUCUMBER_CONFIG = `export default {
  paths: ["tests/features/**/*.feature"],
  import: ["tests/steps/**/*.ts"],
  format: ["progress"],
};
`;

const PLAYWRIGHT_CONFIG = `import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.SDD_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: process.env.SDD_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run start:ui",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
`;

const SMOKE_FEATURE = `# language: pt
Funcionalidade: Smoke SDD

  @api
  Cenário: Kit reconhece passos básicos
    Dado que o ambiente de teste está pronto
    Quando o smoke do kit é executado
    Então o resultado deve ser sucesso
`;

const SMOKE_STEPS = `import { Given, When, Then } from "@cucumber/cucumber";
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
`;

const SMOKE_E2E = `import { test, expect } from "@playwright/test";

test("smoke UI body is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});
`;

export async function scaffoldProject(options: ScaffoldOptions): Promise<SddManifest> {
  const { projectRoot } = options;
  const manifest = {
    ...createDefaultManifest(),
    ...options.manifest,
    paths: {
      ...createDefaultManifest().paths,
      ...(options.manifest?.paths ?? {}),
    },
    runners: {
      ...createDefaultManifest().runners,
      ...(options.manifest?.runners ?? {}),
    },
    triggers: {
      ...createDefaultManifest().triggers,
      ...(options.manifest?.triggers ?? {}),
    },
    loop: {
      ...createDefaultManifest().loop,
      ...(options.manifest?.loop ?? {}),
    },
  } satisfies SddManifest;

  const dirs = [
    manifest.paths.specs,
    path.dirname(manifest.paths.premises),
    manifest.paths.canonical,
    manifest.paths.plan,
    manifest.paths.runs,
    manifest.paths.features,
    manifest.paths.steps,
    manifest.paths.e2e,
    manifest.paths.src,
  ];

  for (const rel of dirs) {
    await mkdir(resolveSddPath(projectRoot, rel), { recursive: true });
  }

  const yamlPath = resolveSddPath(projectRoot, DEFAULT_PATHS.manifest);
  await writeIfMissing(yamlPath, manifestToYaml(manifest));

  await writeIfMissing(
    path.join(projectRoot, "cucumber.js"),
    CUCUMBER_CONFIG,
  );
  await writeIfMissing(
    path.join(projectRoot, "playwright.config.ts"),
    PLAYWRIGHT_CONFIG,
  );

  const runCucumberSrc = path.join(TEMPLATES_DIR, "run-cucumber.mjs");
  if (await exists(runCucumberSrc)) {
    await writeIfMissing(
      path.join(projectRoot, "scripts", "run-cucumber.mjs"),
      await readFile(runCucumberSrc, "utf8"),
    );
  }

  if (options.includeSmokeFixtures !== false) {
    await writeIfMissing(
      path.join(resolveSddPath(projectRoot, manifest.paths.features), "smoke.feature"),
      SMOKE_FEATURE,
    );
    await writeIfMissing(
      path.join(resolveSddPath(projectRoot, manifest.paths.steps), "smoke.steps.ts"),
      SMOKE_STEPS,
    );
    await writeIfMissing(
      path.join(resolveSddPath(projectRoot, manifest.paths.e2e), "smoke.spec.ts"),
      SMOKE_E2E,
    );
  }

  // Copy optional template assets if present
  const templatePkg = path.join(TEMPLATES_DIR, "README.scaffold.md");
  if (await exists(templatePkg)) {
    const dest = path.join(projectRoot, ".sdd", "ADAPTER_TS.md");
    if (!(await exists(dest))) {
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(templatePkg, dest);
    }
  }

  return manifest;
}

export const SCAFFOLD_PACKAGE_SCRIPTS = {
  setup: "npm install && npx playwright install chromium",
  "sdd:verify:cucumber": "node scripts/run-cucumber.mjs",
  "sdd:verify:playwright": "playwright test",
  "sdd:verify:all": "npm run sdd:verify:cucumber && npm run sdd:verify:playwright",
} as const;
