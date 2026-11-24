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

const MAIN_TF = `terraform {
  required_version = ">= 1.6.0"
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

variable "greeting" {
  type    = string
  default = "hello"
}

resource "null_resource" "marker" {
  triggers = {
    greeting = var.greeting
  }
}

output "greeting" {
  value = var.greeting
}
`;

const SMOKE_TEST = `run "smoke_greeting" {
  command = plan

  assert {
    condition     = var.greeting == "hello"
    error_message = "default greeting should be hello"
  }
}
`;

export async function scaffoldProject(
  options: ScaffoldOptions,
): Promise<SddManifest> {
  const { projectRoot } = options;
  const base = createDefaultManifest();
  const manifest = {
    ...base,
    ...options.manifest,
    adapter: "terraform" as const,
    paths: {
      ...base.paths,
      src: ".",
      ...(options.manifest?.paths ?? {}),
    },
    runners: {
      ...base.runners,
      fmt: "terraform fmt -check -recursive",
      validate: "terraform init -backend=false && terraform validate",
      terraform: "terraform test",
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
    "tests",
  ]) {
    await mkdir(resolveSddPath(projectRoot, rel), { recursive: true });
  }

  await writeIfMissing(
    resolveSddPath(projectRoot, DEFAULT_PATHS.manifest),
    manifestToYaml(manifest),
  );
  await writeIfMissing(path.join(projectRoot, "main.tf"), MAIN_TF);

  if (options.includeSmokeFixtures !== false) {
    await writeIfMissing(
      path.join(projectRoot, "tests", "smoke.tftest.hcl"),
      SMOKE_TEST,
    );
  }

  const readme = path.join(TEMPLATES_DIR, "README.scaffold.md");
  if (await exists(readme)) {
    const dest = path.join(projectRoot, ".sdd", "ADAPTER_TERRAFORM.md");
    if (!(await exists(dest))) {
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(readme, dest);
    }
  }

  return manifest;
}

export const SCAFFOLD_PACKAGE_SCRIPTS = {
  "sdd:verify:fmt": "terraform fmt -check -recursive",
  "sdd:verify:validate": "terraform init -backend=false && terraform validate",
  "sdd:verify:terraform": "terraform test",
  "sdd:verify:all":
    "npm run sdd:verify:fmt && npm run sdd:verify:validate && npm run sdd:verify:terraform",
} as const;
