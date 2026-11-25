import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDefaultManifest,
  DEFAULT_PATHS,
  resolveSddPath,
  type SddManifest,
} from "@rogeriobatista/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../templates");

function manifestToYaml(manifest: SddManifest): string {
  const lines = [
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
  ];
  return lines.join("\n");
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

const SMOKE_TEST = `def test_smoke_environment_ready():
    """Dado que o ambiente de teste está pronto → Então sucesso."""
    assert True
`;

const SRC_INIT = `"""Application package (agent-owned under SDD implement)."""
`;

export async function scaffoldProject(
  options: ScaffoldOptions,
): Promise<SddManifest> {
  const { projectRoot } = options;
  const base = createDefaultManifest();
  const manifest = {
    ...base,
    ...options.manifest,
    adapter: "python" as const,
    paths: { ...base.paths, ...(options.manifest?.paths ?? {}) },
    runners: {
      ...base.runners,
      pytest: "pytest -q",
      all: "pytest -q",
      ...(options.manifest?.runners ?? {}),
    },
    triggers: { ...base.triggers, ...(options.manifest?.triggers ?? {}) },
    loop: { ...base.loop, ...(options.manifest?.loop ?? {}) },
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
    "tests",
  ];
  for (const rel of dirs) {
    await mkdir(resolveSddPath(projectRoot, rel), { recursive: true });
  }

  await writeIfMissing(
    resolveSddPath(projectRoot, DEFAULT_PATHS.manifest),
    manifestToYaml(manifest),
  );

  for (const name of ["pyproject.toml", "requirements.txt"]) {
    const src = path.join(TEMPLATES_DIR, name);
    if (await exists(src)) {
      await writeIfMissing(
        path.join(projectRoot, name),
        await readFile(src, "utf8"),
      );
    }
  }

  await writeIfMissing(
    path.join(projectRoot, "src", "__init__.py"),
    SRC_INIT,
  );
  await writeIfMissing(path.join(projectRoot, "tests", "__init__.py"), "");

  if (options.includeSmokeFixtures !== false) {
    await writeIfMissing(
      path.join(projectRoot, "tests", "test_smoke.py"),
      SMOKE_TEST,
    );
  }

  const readme = path.join(TEMPLATES_DIR, "README.scaffold.md");
  if (await exists(readme)) {
    const dest = path.join(projectRoot, ".sdd", "ADAPTER_PYTHON.md");
    if (!(await exists(dest))) {
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(readme, dest);
    }
  }

  return manifest;
}

export const SCAFFOLD_PACKAGE_SCRIPTS = {
  "sdd:verify:pytest": "pytest -q",
  "sdd:verify:all": "pytest -q",
} as const;
