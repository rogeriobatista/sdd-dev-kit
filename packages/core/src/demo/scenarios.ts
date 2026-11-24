import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PATHS } from "../paths.js";
import type { CanonicalDocument, RunReport, StepKeyword } from "../types.js";
import { scrubSecrets } from "./secrets.js";
import type {
  DemoFeature,
  DemoScenario,
  DemoScenarioStep,
  EvidenceFile,
  ScenarioDemoStatus,
} from "./types.js";

const STEP_RE = /^(Dado|Quando|Então|E)\s+(.+)$/i;
const SCENARIO_HEADING_RE = /^###\s+(.+?)\s*$/;
const INTENTION_HEADING_RE = /^##\s+Inten[cç][aã]o\s*$/i;
const FEATURE_TITLE_RE = /^#\s+(.+)\s*$/;

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function parseTags(titleLine: string): { title: string; tags: string[] } {
  const tags: string[] = [];
  const title = titleLine
    .replace(/@([\w-]+)/g, (_, t: string) => {
      tags.push(t);
      return "";
    })
    .trim();
  return { title, tags };
}

/** Load features from canonical JSON, falling back to NL specs. */
export function loadDemoFeatures(projectRoot: string): DemoFeature[] {
  const canonicalDir = path.join(projectRoot, DEFAULT_PATHS.canonical);
  const fromCanonical = loadFromCanonical(canonicalDir);
  if (fromCanonical.length > 0) return fromCanonical;
  return loadFromSpecs(path.join(projectRoot, DEFAULT_PATHS.specs));
}

function loadFromCanonical(canonicalDir: string): DemoFeature[] {
  if (!fs.existsSync(canonicalDir)) return [];
  const files = fs
    .readdirSync(canonicalDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const features: DemoFeature[] = [];
  for (const file of files) {
    const doc = readJson<CanonicalDocument>(path.join(canonicalDir, file));
    if (!doc?.scenarios?.length) continue;
    features.push({
      title: doc.featureTitle || file.replace(/\.json$/, ""),
      intention: doc.intention,
      sourceFile: doc.sourceFile,
      scenarios: doc.scenarios.map((s) => ({
        id: s.id,
        title: s.title,
        intention: s.intention ?? doc.intention,
        sourceFile: s.sourceFile,
        tags: s.tags ?? [],
        steps: (s.steps ?? []).map((st) => ({
          keyword: st.keyword,
          text: st.text,
        })),
        status: "unknown" as ScenarioDemoStatus,
        evidence: [],
      })),
    });
  }
  return features;
}

function loadFromSpecs(specsDir: string): DemoFeature[] {
  if (!fs.existsSync(specsDir)) return [];
  const files = fs
    .readdirSync(specsDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();
  const features: DemoFeature[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(specsDir, file), "utf8");
    const feature = parseSpecMarkdown(raw, file);
    if (feature.scenarios.length > 0 || feature.intention) {
      features.push(feature);
    }
  }
  return features;
}

export function parseSpecMarkdown(raw: string, sourceFile: string): DemoFeature {
  const lines = raw.split(/\r?\n/);
  let title = sourceFile.replace(/\.md$/, "");
  let intention = "";
  let inIntention = false;
  const scenarios: DemoScenario[] = [];
  let current: DemoScenario | null = null;

  for (const line of lines) {
    const featureMatch = line.match(FEATURE_TITLE_RE);
    if (featureMatch && !line.startsWith("##")) {
      title = featureMatch[1]!.trim();
      continue;
    }
    if (INTENTION_HEADING_RE.test(line)) {
      inIntention = true;
      continue;
    }
    if (line.startsWith("## ")) {
      inIntention = false;
    }
    const scenMatch = line.match(SCENARIO_HEADING_RE);
    if (scenMatch) {
      inIntention = false;
      if (current) scenarios.push(current);
      const { title: scenTitle, tags } = parseTags(scenMatch[1]!);
      current = {
        id: `${slugify(sourceFile)}__${slugify(scenTitle)}`,
        title: scenTitle,
        sourceFile,
        tags,
        steps: [],
        status: "unknown",
        evidence: [],
      };
      continue;
    }
    if (inIntention && line.trim() && !line.startsWith("#")) {
      intention = intention ? `${intention} ${line.trim()}` : line.trim();
      continue;
    }
    const stepMatch = line.match(STEP_RE);
    if (stepMatch && current) {
      const keyword = (stepMatch[1]![0]!.toUpperCase() +
        stepMatch[1]!.slice(1).toLowerCase()) as StepKeyword;
      // Normalize Portuguese accents for keyword matching
      const kwRaw = stepMatch[1]!;
      const kwNorm = normalizeKeyword(kwRaw);
      current.steps.push({
        keyword: kwNorm,
        text: stepMatch[2]!.trim(),
      } satisfies DemoScenarioStep);
    }
  }
  if (current) scenarios.push(current);

  for (const s of scenarios) {
    if (intention) s.intention = intention;
  }

  return {
    title,
    intention: intention || undefined,
    sourceFile,
    scenarios,
  };
}

function normalizeKeyword(raw: string): StepKeyword | string {
  const n = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (n === "dado") return "Dado";
  if (n === "quando") return "Quando";
  if (n === "entao") return "Então";
  if (n === "e") return "E";
  return raw;
}

interface ParsedResult {
  /** Map of normalized title / id → status */
  byKey: Map<string, { status: ScenarioDemoStatus; detail?: string }>;
  overall: ScenarioDemoStatus;
}

function normKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cucumberStatus(status: string | undefined): ScenarioDemoStatus {
  switch ((status ?? "").toLowerCase()) {
    case "passed":
      return "passed";
    case "failed":
    case "ambiguous":
    case "undefined":
      return "failed";
    case "skipped":
    case "pending":
      return "skipped";
    default:
      return "unknown";
  }
}

/** Parse Cucumber JSON (array of features). */
export function parseCucumberJson(raw: unknown): ParsedResult {
  const byKey = new Map<string, { status: ScenarioDemoStatus; detail?: string }>();
  let overall: ScenarioDemoStatus = "unknown";
  if (!Array.isArray(raw)) return { byKey, overall };
  let anyFail = false;
  let anyPass = false;
  for (const feature of raw) {
    const elements = (feature as { elements?: unknown[] })?.elements ?? [];
    for (const el of elements) {
      const e = el as {
        name?: string;
        id?: string;
        steps?: Array<{ result?: { status?: string; error_message?: string } }>;
      };
      const steps = e.steps ?? [];
      let status: ScenarioDemoStatus = "passed";
      let detail: string | undefined;
      for (const st of steps) {
        const s = cucumberStatus(st.result?.status);
        if (s === "failed") {
          status = "failed";
          detail = scrubSecrets(st.result?.error_message ?? "falhou");
          break;
        }
        if (s === "skipped" && status === "passed") status = "skipped";
        if (s === "unknown" && status === "passed") status = "unknown";
      }
      if (status === "failed") anyFail = true;
      if (status === "passed") anyPass = true;
      if (e.name) byKey.set(normKey(e.name), { status, detail });
      if (e.id) byKey.set(normKey(e.id), { status, detail });
    }
  }
  overall = anyFail ? "failed" : anyPass ? "passed" : "unknown";
  return { byKey, overall };
}

/** Parse Playwright JSON reporter output (v1.x shape). */
export function parsePlaywrightJson(raw: unknown): ParsedResult {
  const byKey = new Map<string, { status: ScenarioDemoStatus; detail?: string }>();
  let overall: ScenarioDemoStatus = "unknown";
  const suites = (raw as { suites?: unknown[] })?.suites;
  if (!Array.isArray(suites)) {
    // Alternate: list of specs
    const specs = (raw as { specs?: unknown[] })?.specs;
    if (Array.isArray(specs)) {
      walkPlaywrightSpecs(specs, byKey);
    }
    return finalize(byKey);
  }
  const stack = [...suites];
  while (stack.length) {
    const suite = stack.pop() as {
      title?: string;
      suites?: unknown[];
      specs?: unknown[];
    };
    if (suite.suites) stack.push(...suite.suites);
    if (suite.specs) walkPlaywrightSpecs(suite.specs, byKey);
  }
  return finalize(byKey);

  function finalize(map: Map<string, { status: ScenarioDemoStatus; detail?: string }>): ParsedResult {
    let anyFail = false;
    let anyPass = false;
    for (const v of map.values()) {
      if (v.status === "failed") anyFail = true;
      if (v.status === "passed") anyPass = true;
    }
    overall = anyFail ? "failed" : anyPass ? "passed" : "unknown";
    return { byKey: map, overall };
  }
}

function walkPlaywrightSpecs(
  specs: unknown[],
  byKey: Map<string, { status: ScenarioDemoStatus; detail?: string }>,
): void {
  for (const spec of specs) {
    const s = spec as {
      title?: string;
      ok?: boolean;
      tests?: Array<{
        results?: Array<{ status?: string; error?: { message?: string } }>;
        status?: string;
      }>;
    };
    let status: ScenarioDemoStatus = "unknown";
    let detail: string | undefined;
    if (typeof s.ok === "boolean") {
      status = s.ok ? "passed" : "failed";
    }
    for (const t of s.tests ?? []) {
      const last = t.results?.[t.results.length - 1];
      const st = (last?.status ?? t.status ?? "").toLowerCase();
      if (st === "passed" || st === "expected") status = "passed";
      else if (st === "failed" || st === "unexpected" || st === "timedout") {
        status = "failed";
        detail = scrubSecrets(last?.error?.message ?? "falhou");
      } else if (st === "skipped") status = "skipped";
    }
    if (s.title) byKey.set(normKey(s.title), { status, detail });
  }
}

/** Parse JUnit XML (pytest). Lightweight string parse — no XML dependency. */
export function parseJunitXml(xml: string): ParsedResult {
  const byKey = new Map<string, { status: ScenarioDemoStatus; detail?: string }>();
  // Prefer self-closing first so `.../>` is not treated as an open tag.
  const caseRe =
    /<testcase\b([^>]*?)\/>|<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/gi;
  let m: RegExpExecArray | null;
  let anyFail = false;
  let anyPass = false;
  while ((m = caseRe.exec(xml))) {
    const attrs = m[1] ?? m[2] ?? "";
    const body = m[3] ?? "";
    const nameMatch = /\bname="([^"]*)"/.exec(attrs);
    const classMatch = /\bclassname="([^"]*)"/.exec(attrs);
    const name = nameMatch?.[1] ?? "";
    const classname = classMatch?.[1] ?? "";
    let status: ScenarioDemoStatus = "passed";
    let detail: string | undefined;
    if (/<failure\b/i.test(body) || /<error\b/i.test(body)) {
      status = "failed";
      anyFail = true;
      const msg =
        /<(?:failure|error)\b[^>]*message="([^"]*)"/.exec(body)?.[1] ??
        "falhou";
      detail = scrubSecrets(msg);
    } else if (/<skipped\b/i.test(body)) {
      status = "skipped";
    } else {
      anyPass = true;
    }
    if (name) byKey.set(normKey(name), { status, detail });
    if (classname && name) {
      byKey.set(normKey(`${classname} ${name}`), { status, detail });
    }
  }
  const overall: ScenarioDemoStatus = anyFail
    ? "failed"
    : anyPass
      ? "passed"
      : "unknown";
  return { byKey, overall };
}

export function loadRunReport(runReportPath: string | null): RunReport | null {
  if (!runReportPath) return null;
  return readJson<RunReport>(runReportPath);
}

/**
 * Merge evidence results into feature scenarios (match by title / id).
 * When no per-scenario results exist, leave status unknown but keep narrative.
 */
export function applyResultsToFeatures(
  features: DemoFeature[],
  evidence: EvidenceFile[],
  runReport: RunReport | null,
): { features: DemoFeature[]; overallStatus: ScenarioDemoStatus; notes: string[] } {
  const notes: string[] = [];
  const merged = new Map<string, { status: ScenarioDemoStatus; detail?: string }>();

  for (const file of evidence) {
    if (file.kind === "cucumber-json") {
      try {
        const raw = JSON.parse(fs.readFileSync(file.absolutePath, "utf8"));
        const parsed = parseCucumberJson(raw);
        for (const [k, v] of parsed.byKey) merged.set(k, v);
      } catch {
        notes.push(`Não foi possível ler ${file.relativePath}`);
      }
    }
    if (file.kind === "playwright-json") {
      try {
        const raw = JSON.parse(fs.readFileSync(file.absolutePath, "utf8"));
        const parsed = parsePlaywrightJson(raw);
        for (const [k, v] of parsed.byKey) merged.set(k, v);
      } catch {
        notes.push(`Não foi possível ler ${file.relativePath}`);
      }
    }
    if (file.kind === "pytest-junit") {
      try {
        const xml = fs.readFileSync(file.absolutePath, "utf8");
        const parsed = parseJunitXml(xml);
        for (const [k, v] of parsed.byKey) merged.set(k, v);
      } catch {
        notes.push(`Não foi possível ler ${file.relativePath}`);
      }
    }
  }

  // Attach media evidence loosely to UI scenarios (all screenshots/videos)
  const media = evidence.filter(
    (e) =>
      e.kind === "screenshot" ||
      e.kind === "video" ||
      e.kind === "playwright-trace" ||
      e.kind === "playwright-html",
  );

  let anyFail = false;
  let anyPass = false;
  let anyKnown = false;

  const out: DemoFeature[] = features.map((feature) => ({
    ...feature,
    scenarios: feature.scenarios.map((scenario) => {
      const keys = [normKey(scenario.title), normKey(scenario.id)];
      let hit: { status: ScenarioDemoStatus; detail?: string } | undefined;
      for (const k of keys) {
        if (merged.has(k)) {
          hit = merged.get(k);
          break;
        }
      }
      // Fuzzy: scenario title contained in a result key or vice-versa
      if (!hit) {
        for (const [k, v] of merged) {
          if (k.includes(normKey(scenario.title)) || normKey(scenario.title).includes(k)) {
            hit = v;
            break;
          }
        }
      }
      let status: ScenarioDemoStatus = hit?.status ?? "unknown";
      const detail = hit?.detail;
      if (status === "unknown" && runReport?.runners?.length) {
        const failed = runReport.runners.some((r) => r.exitCode !== 0);
        const ok = runReport.runners.every((r) => r.exitCode === 0);
        if (failed) {
          // Keep unknown per scenario; overall will reflect runners
        } else if (ok && runReport.status === "passed") {
          status = "passed";
        }
      }
      if (status === "failed") anyFail = true;
      if (status === "passed") anyPass = true;
      if (status !== "unknown") anyKnown = true;

      const isUi =
        scenario.tags.some((t) => ["ui", "e2e"].includes(t.toLowerCase())) ||
        /tela|checkout|ui|home/i.test(scenario.title);
      const scenarioEvidence = isUi ? [...media] : [];

      return {
        ...scenario,
        status,
        detail,
        evidence: scenarioEvidence,
      };
    }),
  }));

  // Overall from run report runners if scenario map empty
  let overallStatus: ScenarioDemoStatus = anyFail
    ? "failed"
    : anyPass
      ? "passed"
      : "unknown";

  if (!anyKnown && runReport?.runners?.length) {
    const failed = runReport.runners.some((r) => r.exitCode !== 0);
    overallStatus = failed ? "failed" : "passed";
    notes.push(
      "Status geral inferido dos runners do relatório SDD (sem mapeamento por cenário).",
    );
  } else if (!anyKnown && runReport?.status) {
    if (runReport.status === "passed") overallStatus = "passed";
    else if (runReport.status === "failed") overallStatus = "failed";
  }

  if (features.length === 0) {
    notes.push(
      "Nenhum cenário encontrado em canonical/specs — demo contém apenas evidências e resumo da execução.",
    );
  }

  return { features: out, overallStatus, notes };
}
