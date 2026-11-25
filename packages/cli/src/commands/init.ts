import path from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import {
  alignSddYamlAdapter,
  detectStack,
  normalizeStackId,
  writeStackProvenance,
  type StackAdapterId,
} from "@sdd-dev-kit/core";
import {
  copyDirIfMissing,
  copyFileIfMissing,
  isDirectory,
  pathExists,
  writeIfMissing,
} from "../fs-utils.js";
import {
  hostPackageRoot,
  sharedPackageRoot,
  stackPackageName,
  stackPackageRoot,
  type HostId,
  type StackId,
} from "../package-paths.js";
import { resolveProjectRoot } from "../project.js";

export type InitOptions = {
  projectRoot?: string;
  host?: string;
  stack?: string;
  dryRun?: boolean;
};

export type InitResult = {
  projectRoot: string;
  hosts: HostId[];
  stack: StackAdapterId | null;
  stackSource: string;
  written: string[];
  warnings: string[];
  needsClarification: boolean;
  dryRun: boolean;
};

const ALL_HOSTS: HostId[] = ["cursor", "claude", "copilot"];

function parseHosts(raw: string | undefined): HostId[] {
  const value = (raw ?? "cursor").toLowerCase();
  if (value === "all") return [...ALL_HOSTS];
  if (value === "cursor" || value === "claude" || value === "copilot") {
    return [value];
  }
  throw new Error(
    `Invalid --host "${raw}". Use cursor | claude | copilot | all.`,
  );
}

function stackPremisesSnippet(stack: StackAdapterId): string {
  const lines: Record<StackAdapterId, string[]> = {
    typescript: [
      "- adapter: typescript",
      "- TypeScript",
      "- Aceitação/domínio: Cucumber (`@cucumber/cucumber`)",
      "- UI/E2E: Playwright (`@playwright/test`)",
    ],
    python: [
      "- adapter: python",
      "- Python + pytest",
    ],
    "react-vite": [
      "- adapter: react-vite",
      "- React + Vite",
      "- UI/E2E: Playwright",
    ],
    "node-graphql": [
      "- adapter: node-graphql",
      "- Node + TypeScript GraphQL",
      "- Aceitação: Cucumber / Vitest",
    ],
    terraform: [
      "- adapter: terraform",
      "- Terraform (fmt / validate / test — sem apply)",
    ],
  };
  return [
    "# Premises do projeto",
    "",
    "## Stack",
    ...lines[stack],
    "",
    "## Tags",
    "- `@api` → track de API / domínio",
    "- `@ui` / `@e2e` → Playwright quando o adapter suportar",
    "",
    "## Idioma dos specs",
    "- Português: `Dado` / `Quando` / `Então` / `E`",
    "",
    "## Fronteiras",
    "- Humano edita só `specs/` e este arquivo quando necessário",
    "- Artefatos gerados em `tests/`, `.sdd/canonical`, `.sdd/plan` são regeneráveis",
    "",
  ].join("\n");
}

async function installHost(
  projectRoot: string,
  host: HostId,
  dryRun: boolean,
): Promise<string[]> {
  const written: string[] = [];
  const root = hostPackageRoot(host);

  if (host === "cursor") {
    const pairs: Array<[string, string]> = [
      [
        path.join(root, "skills", "sdd"),
        path.join(projectRoot, ".cursor", "skills", "sdd"),
      ],
      [
        path.join(root, "rules", "sdd-human-edits.mdc"),
        path.join(projectRoot, ".cursor", "rules", "sdd-human-edits.mdc"),
      ],
    ];
    for (const [src, dest] of pairs) {
      if (dryRun) {
        written.push(`[dry-run] ${path.relative(projectRoot, dest) || dest}`);
        continue;
      }
      if (!(await pathExists(src))) continue;
      if (await isDirectory(src)) {
        const files = await copyDirIfMissing(src, dest);
        written.push(...files.map((f) => path.relative(projectRoot, f) || f));
      } else if (await copyFileIfMissing(src, dest)) {
        written.push(path.relative(projectRoot, dest) || dest);
      }
    }
    return written;
  }

  if (host === "claude") {
    const projectDir = path.join(root, "project");
    const pairs: Array<[string, string]> = [
      [
        path.join(projectDir, "CLAUDE.md"),
        path.join(projectRoot, "CLAUDE.md"),
      ],
      [
        path.join(projectDir, ".claude", "skills", "sdd"),
        path.join(projectRoot, ".claude", "skills", "sdd"),
      ],
    ];
    for (const [src, dest] of pairs) {
      if (dryRun) {
        written.push(`[dry-run] ${path.relative(projectRoot, dest) || dest}`);
        continue;
      }
      if (!(await pathExists(src))) continue;
      if (await isDirectory(src)) {
        const files = await copyDirIfMissing(src, dest);
        written.push(...files.map((f) => path.relative(projectRoot, f) || f));
      } else if (await copyFileIfMissing(src, dest)) {
        written.push(path.relative(projectRoot, dest) || dest);
      }
    }
    return written;
  }

  // copilot
  const projectDir = path.join(root, "project");
  const pairs: Array<[string, string]> = [
    [
      path.join(projectDir, ".github", "copilot-instructions.md"),
      path.join(projectRoot, ".github", "copilot-instructions.md"),
    ],
    [
      path.join(projectDir, ".github", "prompts"),
      path.join(projectRoot, ".github", "prompts"),
    ],
  ];
  for (const [src, dest] of pairs) {
    if (dryRun) {
      written.push(`[dry-run] ${path.relative(projectRoot, dest) || dest}`);
      continue;
    }
    if (!(await pathExists(src))) continue;
    if (await isDirectory(src)) {
      const files = await copyDirIfMissing(src, dest);
      written.push(...files.map((f) => path.relative(projectRoot, f) || f));
    } else if (await copyFileIfMissing(src, dest)) {
      written.push(path.relative(projectRoot, dest) || dest);
    }
  }
  return written;
}

async function writeSharedTemplates(
  projectRoot: string,
  stack: StackAdapterId | null,
  dryRun: boolean,
): Promise<string[]> {
  const written: string[] = [];
  const shared = sharedPackageRoot();
  const templates = path.join(shared, "templates");

  const targets: Array<{ src: string; dest: string; contents?: string }> = [
    {
      src: path.join(templates, "sdd.yaml"),
      dest: path.join(projectRoot, "sdd.yaml"),
    },
    {
      src: path.join(templates, "specs", "_example.md"),
      dest: path.join(projectRoot, "specs", "_example.md"),
    },
    {
      src: path.join(templates, ".sdd", "premises.md"),
      dest: path.join(projectRoot, ".sdd", "premises.md"),
      contents: stack ? stackPremisesSnippet(stack) : undefined,
    },
  ];

  // Prefer stack-specific sdd.yaml from the stack package when available
  if (stack) {
    try {
      const stackYaml = path.join(
        stackPackageRoot(stack as StackId),
        "templates",
        "sdd.yaml",
      );
      if (await pathExists(stackYaml)) {
        targets[0] = { src: stackYaml, dest: path.join(projectRoot, "sdd.yaml") };
      }
    } catch {
      // keep shared template
    }
  }

  for (const t of targets) {
    const rel = path.relative(projectRoot, t.dest) || t.dest;
    if (dryRun) {
      written.push(`[dry-run] ${rel}`);
      continue;
    }
    if (t.contents) {
      if (await writeIfMissing(t.dest, t.contents)) written.push(rel);
      continue;
    }
    if (!(await pathExists(t.src))) continue;
    if (await copyFileIfMissing(t.src, t.dest)) written.push(rel);
  }

  // Ensure base dirs exist
  if (!dryRun) {
    for (const rel of [
      "specs",
      ".sdd",
      ".sdd/canonical",
      ".sdd/plan",
      ".sdd/runs",
      ".sdd/evidence",
      ".sdd/demo",
      "src",
    ]) {
      await mkdir(path.join(projectRoot, rel), { recursive: true });
    }
  }

  return written;
}

async function scaffoldStack(
  projectRoot: string,
  stack: StackAdapterId,
  dryRun: boolean,
): Promise<string[]> {
  if (dryRun) {
    return [`[dry-run] scaffold via ${stackPackageName(stack as StackId)}`];
  }

  const written: string[] = [];
  switch (stack) {
    case "typescript": {
      const { scaffoldProject } = await import("@sdd-dev-kit/adapter-ts");
      await scaffoldProject({
        projectRoot,
        manifest: { adapter: "typescript" },
        includeSmokeFixtures: false,
      });
      written.push("scaffold:adapter-ts");
      break;
    }
    case "python": {
      const { scaffoldProject } = await import("@sdd-dev-kit/adapter-python");
      await scaffoldProject({
        projectRoot,
        manifest: { adapter: "python" },
        includeSmokeFixtures: false,
      });
      written.push("scaffold:adapter-python");
      break;
    }
    case "react-vite": {
      const { scaffoldProject } = await import(
        "@sdd-dev-kit/adapter-react-vite"
      );
      await scaffoldProject({
        projectRoot,
        manifest: { adapter: "react-vite" },
        includeSmokeFixtures: false,
      });
      written.push("scaffold:adapter-react-vite");
      break;
    }
    case "node-graphql": {
      const { scaffoldProject } = await import(
        "@sdd-dev-kit/adapter-node-graphql"
      );
      await scaffoldProject({
        projectRoot,
        manifest: { adapter: "node-graphql" },
        includeSmokeFixtures: false,
      });
      written.push("scaffold:adapter-node-graphql");
      break;
    }
    case "terraform": {
      const { scaffoldProject } = await import(
        "@sdd-dev-kit/adapter-terraform"
      );
      await scaffoldProject({
        projectRoot,
        manifest: { adapter: "terraform" },
        includeSmokeFixtures: false,
      });
      written.push("scaffold:adapter-terraform");
      break;
    }
  }
  return written;
}

export async function runInit(options: InitOptions = {}): Promise<InitResult> {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const dryRun = Boolean(options.dryRun);
  const hosts = parseHosts(options.host);
  const warnings: string[] = [];
  const written: string[] = [];

  let stack: StackAdapterId | null = null;
  let stackSource = "missing";
  let needsClarification = false;

  if (options.stack) {
    const normalized = normalizeStackId(options.stack);
    if (!normalized) {
      throw new Error(
        `Invalid --stack "${options.stack}". Use typescript | python | react-vite | node-graphql | terraform.`,
      );
    }
    stack = normalized;
    stackSource = "cli-flag";
  } else {
    const detected = detectStack(projectRoot);
    stack = detected.stack;
    stackSource = detected.source;
    needsClarification = detected.needsClarification;
    warnings.push(...detected.warnings);
  }

  for (const host of hosts) {
    written.push(...(await installHost(projectRoot, host, dryRun)));
  }

  written.push(...(await writeSharedTemplates(projectRoot, stack, dryRun)));

  if (stack && !needsClarification) {
    written.push(...(await scaffoldStack(projectRoot, stack, dryRun)));
    if (!dryRun) {
      const provenanceSource =
        stackSource === "cli-flag" ? "premises" : stackSource;
      writeStackProvenance(projectRoot, {
        stack,
        source: provenanceSource as
          | "premises"
          | "specs"
          | "stack.json"
          | "sdd.yaml"
          | "package-manifest"
          | "ambiguous"
          | "missing",
        confidence: stackSource === "cli-flag" ? "high" : "medium",
        candidates: [stack],
        warnings: [],
        needsClarification: false,
      });
      alignSddYamlAdapter(projectRoot, stack);

      // Ensure premises declare stack when we wrote a custom snippet already;
      // if premises existed with no stack, leave it (human-owned).
      const premisesPath = path.join(projectRoot, ".sdd", "premises.md");
      if (!(await pathExists(premisesPath))) {
        await writeFile(premisesPath, stackPremisesSnippet(stack), "utf8");
        written.push(".sdd/premises.md");
      }
    }
  } else if (!stack || needsClarification) {
    needsClarification = true;
    warnings.push(
      "Declare a single stack under ## Stack in .sdd/premises.md (or pass --stack <id>), then re-run init / run.",
    );
  }

  return {
    projectRoot,
    hosts,
    stack,
    stackSource,
    written,
    warnings,
    needsClarification,
    dryRun,
  };
}

export function formatInitReport(result: InitResult): string {
  const lines = [
    `sdd init ${result.dryRun ? "(dry-run) " : ""}→ ${result.projectRoot}`,
    `hosts: ${result.hosts.join(", ")}`,
    `stack: ${result.stack ?? "(undeclared)"} (source: ${result.stackSource})`,
    "",
    "written:",
    ...(result.written.length
      ? result.written.map((w) => `  - ${w}`)
      : ["  (nothing new — files already present)"]),
  ];
  if (result.warnings.length) {
    lines.push("", "warnings:");
    for (const w of result.warnings) lines.push(`  - ${w}`);
  }
  if (result.needsClarification) {
    lines.push(
      "",
      "Next: set ## Stack in .sdd/premises.md, then edit specs/ or run sdd from-ticket <id>.",
    );
  } else {
    lines.push(
      "",
      "Next: edit specs/*.md (or sdd from-ticket <id>), then use your AI host (/sdd run) or sdd verify.",
    );
  }
  return lines.join("\n");
}
