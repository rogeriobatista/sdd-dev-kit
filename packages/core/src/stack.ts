import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  type StackAdapterId,
  SddStackAdapterIdSchema,
  parseSddYaml,
} from "./schema.js";
import { DEFAULT_PATHS, resolveSddPath } from "./paths.js";

/** Where the stack id was resolved from (authoritative → fallback). */
export type StackDetectionSource =
  | "premises"
  | "specs"
  | "stack.json"
  | "sdd.yaml"
  | "package-manifest"
  | "ambiguous"
  | "missing";

export type StackConfidence = "high" | "medium" | "low" | "none";

export type StackDetectionResult = {
  /** Canonical adapter id, or null when missing/ambiguous. */
  stack: StackAdapterId | null;
  source: StackDetectionSource;
  confidence: StackConfidence;
  /** Competing ids when source is ambiguous or multiple signals fire. */
  candidates: StackAdapterId[];
  warnings: string[];
  /** Agent must stop and ask the human to declare stack in premises. */
  needsClarification: boolean;
};

export type StackProvenance = {
  stack: StackAdapterId;
  source: StackDetectionSource;
  detectedAt: string;
  confidence?: StackConfidence;
};

/** Relative path for machine-readable stack provenance / override. */
export const STACK_JSON_REL = DEFAULT_PATHS.stack;

/**
 * Synonym → canonical adapter id.
 * More specific stacks (react-vite, node-graphql, python, terraform) win
 * over generic typescript when scored together.
 */
const SYNONYM_TO_STACK: ReadonlyArray<{
  pattern: RegExp;
  stack: StackAdapterId;
  weight: number;
}> = [
  // Specific stacks first (higher weight)
  { pattern: /\bterraform\b|\b\.tftest\.hcl\b|\bhcl\b/i, stack: "terraform", weight: 3 },
  { pattern: /\bpytest\b|\bpython\b|\bpyproject\.toml\b/i, stack: "python", weight: 3 },
  {
    pattern: /\breact[-\s]?vite\b|\breact\b|\bvite\b/i,
    stack: "react-vite",
    weight: 3,
  },
  {
    pattern: /\bnode[-\s]?graphql\b|\bgraphql\b|\byoga\b|\bapollo\b/i,
    stack: "node-graphql",
    weight: 3,
  },
  // Generic TS last
  {
    pattern:
      /\btypescript\b|\bts\b|\bcucumber\b|\bplaywright\b|\bnode\.js\b/i,
    stack: "typescript",
    weight: 1,
  },
];

/** Explicit id tokens (frontmatter / @stack: / stack.json). */
const EXPLICIT_ID_ALIASES: Record<string, StackAdapterId> = {
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  pytest: "python",
  "react-vite": "react-vite",
  react: "react-vite",
  vite: "react-vite",
  "node-graphql": "node-graphql",
  graphql: "node-graphql",
  terraform: "terraform",
  tf: "terraform",
  hcl: "terraform",
  node: "typescript", // weak; prefer node-graphql when graphql also present
};

function emptyResult(
  partial: Partial<StackDetectionResult> &
    Pick<StackDetectionResult, "source" | "confidence">,
): StackDetectionResult {
  return {
    stack: null,
    candidates: [],
    warnings: [],
    needsClarification: false,
    ...partial,
  };
}

/** Normalize a raw token to a canonical stack id, or null. */
export function normalizeStackId(raw: string): StackAdapterId | null {
  const key = raw.trim().toLowerCase().replace(/_/g, "-");
  if (!key) return null;
  const aliased = EXPLICIT_ID_ALIASES[key];
  if (aliased) return aliased;
  const parsed = SddStackAdapterIdSchema.safeParse(key);
  return parsed.success ? parsed.data : null;
}

/**
 * Score free-text (premises / ## Stack section) for known stack keywords.
 * Returns unique stacks sorted by descending score.
 */
export function scoreStackKeywords(
  text: string,
): { stack: StackAdapterId; score: number }[] {
  const scores = new Map<StackAdapterId, number>();
  for (const { pattern, stack, weight } of SYNONYM_TO_STACK) {
    if (pattern.test(text)) {
      scores.set(stack, (scores.get(stack) ?? 0) + weight);
    }
  }
  // Disambiguate: "Node + TypeScript" + GraphQL → prefer node-graphql
  if (scores.has("node-graphql") && scores.has("typescript")) {
    scores.delete("typescript");
  }
  // React/Vite mentions imply react-vite over bare typescript
  if (scores.has("react-vite") && scores.has("typescript")) {
    scores.delete("typescript");
  }
  // Python + pytest beat accidental TS mentions
  if (scores.has("python") && scores.has("typescript")) {
    scores.delete("typescript");
  }
  // Terraform alone
  if (scores.has("terraform") && scores.has("typescript")) {
    scores.delete("typescript");
  }

  return [...scores.entries()]
    .map(([stack, score]) => ({ stack, score }))
    .sort((a, b) => b.score - a.score || a.stack.localeCompare(b.stack));
}

function extractStackSection(markdown: string): string | null {
  const start = /^##\s+Stack\b[^\n]*\n/im.exec(markdown);
  if (!start || start.index === undefined) return null;
  const from = start.index + start[0].length;
  const rest = markdown.slice(from);
  const nextHeading = /^##\s/m.exec(rest);
  return nextHeading ? rest.slice(0, nextHeading.index) : rest;
}

function parseFrontmatterStack(markdown: string): StackAdapterId | null {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!fm) return null;
  try {
    const doc = parseYaml(fm[1]!);
    if (doc && typeof doc === "object" && !Array.isArray(doc)) {
      const stack = (doc as Record<string, unknown>).stack;
      if (typeof stack === "string") {
        return normalizeStackId(stack);
      }
    }
  } catch {
    // ignore malformed frontmatter
  }
  return null;
}

/** Collect `@stack:<id>` tags from markdown body. */
function parseStackTags(markdown: string): StackAdapterId[] {
  const found = new Set<StackAdapterId>();
  const re = /@stack:([a-z0-9_-]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const id = normalizeStackId(m[1]!);
    if (id) found.add(id);
  }
  return [...found];
}

function readTextIfExists(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return null;
    }
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function listSpecMarkdownFiles(specsDir: string): string[] {
  if (!fs.existsSync(specsDir) || !fs.statSync(specsDir).isDirectory()) {
    return [];
  }
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        out.push(full);
      }
    }
  };
  walk(specsDir);
  return out.sort();
}

function resolveFromScores(
  scored: { stack: StackAdapterId; score: number }[],
  source: StackDetectionSource,
  confidence: StackConfidence,
): StackDetectionResult | null {
  if (scored.length === 0) return null;
  if (scored.length === 1) {
    return emptyResult({
      stack: scored[0]!.stack,
      source,
      confidence,
      candidates: [scored[0]!.stack],
    });
  }
  // Multiple distinct stacks with comparable scores → ambiguous
  const top = scored[0]!.score;
  const tied = scored.filter((s) => s.score === top);
  if (tied.length > 1) {
    return emptyResult({
      stack: null,
      source: "ambiguous",
      confidence: "none",
      candidates: tied.map((t) => t.stack),
      needsClarification: true,
      warnings: [
        `Ambiguous stack in ${source}: ${tied.map((t) => t.stack).join(", ")}. Declare one stack in .sdd/premises.md.`,
      ],
    });
  }
  return emptyResult({
    stack: scored[0]!.stack,
    source,
    confidence,
    candidates: scored.map((s) => s.stack),
    warnings:
      scored.length > 1
        ? [
            `Multiple stack signals in ${source}; using ${scored[0]!.stack} (also saw ${scored
              .slice(1)
              .map((s) => s.stack)
              .join(", ")}).`,
          ]
        : [],
  });
}

function detectFromPremises(projectRoot: string): StackDetectionResult | null {
  const premisesPath = resolveSddPath(projectRoot, DEFAULT_PATHS.premises);
  const text = readTextIfExists(premisesPath);
  if (text === null) return null;

  // Prefer ## Stack section when present; otherwise whole file
  const section = extractStackSection(text);
  const haystack = section ?? text;
  // Explicit adapter id line like `- adapter: python` or `stack: react-vite`
  const explicit =
    /(?:^|\n)\s*(?:[-*]\s*)?(?:adapter|stack)\s*:\s*([a-z0-9_-]+)/i.exec(
      haystack,
    );
  if (explicit) {
    const id = normalizeStackId(explicit[1]!);
    if (id) {
      return emptyResult({
        stack: id,
        source: "premises",
        confidence: "high",
        candidates: [id],
      });
    }
  }

  return resolveFromScores(scoreStackKeywords(haystack), "premises", "high");
}

function detectFromSpecs(projectRoot: string): StackDetectionResult | null {
  const specsDir = resolveSddPath(projectRoot, DEFAULT_PATHS.specs);
  const files = listSpecMarkdownFiles(specsDir);
  if (files.length === 0) return null;

  const ids = new Set<StackAdapterId>();
  const keywordScores = new Map<StackAdapterId, number>();

  for (const file of files) {
    const text = readTextIfExists(file);
    if (text === null) continue;

    const fm = parseFrontmatterStack(text);
    if (fm) ids.add(fm);

    for (const tag of parseStackTags(text)) {
      ids.add(tag);
    }

    const section = extractStackSection(text);
    if (section) {
      for (const { stack, score } of scoreStackKeywords(section)) {
        keywordScores.set(stack, (keywordScores.get(stack) ?? 0) + score);
      }
    }
  }

  if (ids.size === 1) {
    const only = [...ids][0]!;
    return emptyResult({
      stack: only,
      source: "specs",
      confidence: "high",
      candidates: [only],
    });
  }
  if (ids.size > 1) {
    return emptyResult({
      stack: null,
      source: "ambiguous",
      confidence: "none",
      candidates: [...ids].sort(),
      needsClarification: true,
      warnings: [
        `Ambiguous @stack / frontmatter across specs: ${[...ids].sort().join(", ")}. Declare one stack in .sdd/premises.md.`,
      ],
    });
  }

  const scored = [...keywordScores.entries()]
    .map(([stack, score]) => ({ stack, score }))
    .sort((a, b) => b.score - a.score || a.stack.localeCompare(b.stack));
  return resolveFromScores(scored, "specs", "medium");
}

function detectFromStackJson(projectRoot: string): StackDetectionResult | null {
  const stackPath = resolveSddPath(projectRoot, STACK_JSON_REL);
  const text = readTextIfExists(stackPath);
  if (text === null) return null;
  try {
    const doc = JSON.parse(text) as Partial<StackProvenance> & {
      override?: boolean;
    };
    if (typeof doc.stack !== "string") return null;
    const id = normalizeStackId(doc.stack);
    if (!id) return null;
    return emptyResult({
      stack: id,
      source: "stack.json",
      confidence: doc.override ? "high" : "medium",
      candidates: [id],
      warnings: doc.override
        ? []
        : [
            "Using .sdd/stack.json (no premises/specs stack declaration). Prefer declaring stack in .sdd/premises.md.",
          ],
    });
  } catch {
    return emptyResult({
      source: "stack.json",
      confidence: "none",
      warnings: [".sdd/stack.json exists but could not be parsed."],
      needsClarification: true,
    });
  }
}

function detectFromSddYaml(projectRoot: string): StackDetectionResult | null {
  const yamlPath = resolveSddPath(projectRoot, DEFAULT_PATHS.manifest);
  const text = readTextIfExists(yamlPath);
  if (text === null) return null;
  try {
    const manifest = parseSddYaml(text);
    return emptyResult({
      stack: manifest.adapter,
      source: "sdd.yaml",
      confidence: "low",
      candidates: [manifest.adapter],
      warnings: [
        `Stack taken from sdd.yaml adapter=${manifest.adapter} because premises/specs did not declare a stack. Declare stack in .sdd/premises.md.`,
      ],
    });
  } catch {
    return null;
  }
}

/**
 * Last-resort weak signals from package manifests — NOT primary.
 * Only used when premises, specs, stack.json, and sdd.yaml yield nothing.
 */
function detectFromPackageManifests(
  projectRoot: string,
): StackDetectionResult | null {
  const warnings = [
    "Weak fallback: inferred stack from package.json/pyproject.toml (specification docs did not declare stack).",
  ];

  const pyproject = readTextIfExists(
    resolveSddPath(projectRoot, "pyproject.toml"),
  );
  if (pyproject && /\bpytest\b|\bpython\b/i.test(pyproject)) {
    return emptyResult({
      stack: "python",
      source: "package-manifest",
      confidence: "low",
      candidates: ["python"],
      warnings,
      needsClarification: true,
    });
  }

  const pkgText = readTextIfExists(resolveSddPath(projectRoot, "package.json"));
  if (pkgText) {
    try {
      const pkg = JSON.parse(pkgText) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      const names = Object.keys(deps).join(" ");
      if (/\bterraform\b/i.test(names)) {
        /* unlikely in npm */
      }
      if (
        deps["react"] ||
        deps["vite"] ||
        deps["@vitejs/plugin-react"]
      ) {
        return emptyResult({
          stack: "react-vite",
          source: "package-manifest",
          confidence: "low",
          candidates: ["react-vite"],
          warnings,
          needsClarification: true,
        });
      }
      if (
        deps["graphql"] ||
        deps["graphql-yoga"] ||
        deps["@apollo/server"]
      ) {
        return emptyResult({
          stack: "node-graphql",
          source: "package-manifest",
          confidence: "low",
          candidates: ["node-graphql"],
          warnings,
          needsClarification: true,
        });
      }
      if (
        deps["typescript"] ||
        deps["@cucumber/cucumber"] ||
        deps["@playwright/test"]
      ) {
        return emptyResult({
          stack: "typescript",
          source: "package-manifest",
          confidence: "low",
          candidates: ["typescript"],
          warnings,
          needsClarification: true,
        });
      }
    } catch {
      // ignore
    }
  }

  // Terraform: *.tf at root
  try {
    const root = projectRoot.replace(/\\/g, "/");
    const entries = fs.readdirSync(root);
    if (entries.some((e) => e.endsWith(".tf"))) {
      return emptyResult({
        stack: "terraform",
        source: "package-manifest",
        confidence: "low",
        candidates: ["terraform"],
        warnings: [
          "Weak fallback: inferred terraform from *.tf files (specification docs did not declare stack).",
        ],
        needsClarification: true,
      });
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Detect which stack adapter to use for `projectRoot`.
 *
 * Authoritative order:
 * 1. `.sdd/premises.md` (## Stack / keywords)
 * 2. `specs/` markdown (frontmatter `stack:`, `@stack:<id>`, ## Stack)
 * 3. `.sdd/stack.json` (override / prior provenance)
 * 4. `sdd.yaml` `adapter` / `adapters.stack` (fallback — warn)
 * 5. package.json / pyproject / `*.tf` (last resort — low confidence)
 */
export function detectStack(projectRoot: string): StackDetectionResult {
  const fromPremises = detectFromPremises(projectRoot);
  if (fromPremises?.needsClarification) return fromPremises;
  if (fromPremises?.stack) return fromPremises;

  const fromSpecs = detectFromSpecs(projectRoot);
  if (fromSpecs?.needsClarification) return fromSpecs;
  if (fromSpecs?.stack) return fromSpecs;

  // If premises/specs were ambiguous we already returned; continue fallbacks
  const fromJson = detectFromStackJson(projectRoot);
  if (fromJson?.stack) return fromJson;
  if (fromJson?.needsClarification) return fromJson;

  const fromYaml = detectFromSddYaml(projectRoot);
  if (fromYaml?.stack) return fromYaml;

  const fromPkg = detectFromPackageManifests(projectRoot);
  if (fromPkg) return fromPkg;

  return emptyResult({
    source: "missing",
    confidence: "none",
    needsClarification: true,
    warnings: [
      "No stack declared in .sdd/premises.md or specs. Ask the human to add a ## Stack section (do not invent).",
    ],
  });
}

/** Write `.sdd/stack.json` provenance after a successful detection. */
export function writeStackProvenance(
  projectRoot: string,
  result: StackDetectionResult,
  detectedAt: string = new Date().toISOString(),
): StackProvenance | null {
  if (!result.stack) return null;
  const provenance: StackProvenance = {
    stack: result.stack,
    source: result.source,
    detectedAt,
    confidence: result.confidence,
  };
  const outPath = resolveSddPath(projectRoot, STACK_JSON_REL);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(provenance, null, 2)}\n`, "utf8");
  return provenance;
}

/**
 * Align top-level `adapter:` in sdd.yaml with the detected stack when safe.
 * Does not rewrite when adapters.stack nested form is present (leave nested source of truth).
 * Returns true when the file was updated.
 */
export function alignSddYamlAdapter(
  projectRoot: string,
  stack: StackAdapterId,
): boolean {
  const yamlPath = resolveSddPath(projectRoot, DEFAULT_PATHS.manifest);
  const text = readTextIfExists(yamlPath);
  if (text === null) return false;

  // Prefer not to smash nested adapters.stack blocks — only update top-level adapter:
  if (/^\s*adapters\s*:/m.test(text) && /^\s*stack\s*:/m.test(text)) {
    // Nested form present — update adapters.stack if we can do a simple replace
    const next = text.replace(
      /^(\s*stack\s*:\s*)([a-z0-9_-]+)/m,
      `$1${stack}`,
    );
    if (next !== text) {
      fs.writeFileSync(yamlPath, next, "utf8");
      return true;
    }
    return false;
  }

  if (/^adapter\s*:/m.test(text)) {
    const next = text.replace(/^adapter\s*:\s*[a-z0-9_-]+/m, `adapter: ${stack}`);
    if (next !== text) {
      fs.writeFileSync(yamlPath, next, "utf8");
      return true;
    }
    return false;
  }

  // Insert adapter near top after version if present
  const withAdapter = text.replace(
    /^(version\s*:\s*.+\r?\n)/m,
    `$1adapter: ${stack}\n`,
  );
  if (withAdapter !== text) {
    fs.writeFileSync(yamlPath, withAdapter, "utf8");
    return true;
  }

  fs.writeFileSync(yamlPath, `adapter: ${stack}\n${text}`, "utf8");
  return true;
}
