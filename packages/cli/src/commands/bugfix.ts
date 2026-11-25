import fs from "node:fs";
import path from "node:path";
import {
  BUILTIN_DEBUG_TEMPLATE_PT,
  BUILTIN_QA_TEMPLATE_PT,
  BUILTIN_REPORT_TEMPLATE_PT,
  ensureBugArtifact,
  ensureBugReport,
  listBugIds,
  loadBugTemplate,
  readBugMeta,
  resolveBugPaths,
  writeBugMeta,
  type BugMeta,
} from "@rogeriobatista/core";
import { loadManifest, resolveProjectRoot } from "../project.js";

async function resolveDefaultProvider(
  projectRoot: string,
): Promise<"linear" | "jira" | undefined> {
  const manifest = await loadManifest(projectRoot);
  return manifest?.ticketing?.defaultProvider;
}

export type BugReportCliOptions = {
  projectRoot?: string;
  bugId?: string;
  title?: string;
};

export async function runBugReportCommand(options: BugReportCliOptions = {}) {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const defaultProvider = await resolveDefaultProvider(projectRoot);
  const template = loadBugTemplate(
    projectRoot,
    "REPORT.md",
    BUILTIN_REPORT_TEMPLATE_PT,
  );
  const result = ensureBugReport({
    projectRoot,
    bugId: options.bugId,
    title: options.title,
    defaultProvider,
    reportTemplate: template,
  });
  return { projectRoot, ...result };
}

export function formatBugReportCli(
  r: Awaited<ReturnType<typeof runBugReportCommand>>,
): string {
  return [
    `sdd bug-report → ${r.paths.bugId}`,
    `kind: ${r.paths.kind}`,
    `dir: ${r.paths.bugPath}`,
    `report: ${r.paths.reportRel}`,
    `meta: ${r.paths.metaRel}`,
    `evidenceKey: ${r.paths.evidenceKey}`,
    `created: ${r.created}`,
    `reportWritten: ${r.reportWritten}`,
    "",
    "Human gate: refine REPORT.md (passos, esperado/atual, severidade, ambiente).",
    "Next: sdd reproduce <id> → failing regression before any fix.",
  ].join("\n");
}

export type BugIdCliOptions = {
  projectRoot?: string;
  bugId: string;
};

async function requireBugPaths(options: BugIdCliOptions) {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const defaultProvider = await resolveDefaultProvider(projectRoot);
  if (!options.bugId?.trim()) {
    const known = listBugIds(projectRoot);
    throw new Error(
      known.length
        ? `Missing bug id. Known: ${known.join(", ")}`
        : "Missing bug id. Run sdd bug-report first.",
    );
  }
  const paths = resolveBugPaths(projectRoot, options.bugId, {
    defaultProvider,
  });
  if (!fs.existsSync(paths.reportPath)) {
    throw new Error(
      `No REPORT.md at ${paths.reportRel}. Run: sdd bug-report ${options.bugId}`,
    );
  }
  return { projectRoot, paths, defaultProvider };
}

function patchMeta(
  bugDir: string,
  patch: Partial<BugMeta>,
): BugMeta {
  const existing = readBugMeta(bugDir);
  const now = new Date().toISOString();
  const meta: BugMeta = {
    bugId: existing?.bugId ?? path.basename(bugDir),
    kind: existing?.kind ?? "local",
    evidenceKey: existing?.evidenceKey ?? existing?.bugId ?? path.basename(bugDir),
    encodedId: existing?.encodedId ?? path.basename(bugDir),
    createdAt: existing?.createdAt ?? now,
    ticket: existing?.ticket,
    regressionTest: existing?.regressionTest ?? null,
    status: existing?.status ?? "reported",
    ...patch,
    updatedAt: now,
  };
  writeBugMeta(bugDir, meta);
  return meta;
}

export async function runReproduceCommand(options: BugIdCliOptions) {
  const { projectRoot, paths } = await requireBugPaths(options);
  const meta = patchMeta(paths.bugDir, { status: "reproducing" });
  const guidance = [
    "SDD reproduce — TDD for bugs (host-driven)",
    "",
    "1. Read REPORT.md; do not invent steps missing from the client report.",
    "2. Add a failing Spec Test or e2e under tests/ that locks the bug.",
    "3. Run until red; record relative path in meta.json → regressionTest.",
    "4. Only then: sdd fix <id> (never fix without a red regression).",
    "",
    `report: ${paths.reportRel}`,
    `meta.status: ${meta.status}`,
    `evidenceKey: ${paths.evidenceKey}`,
  ].join("\n");
  return { projectRoot, paths, meta, guidance };
}

export async function runDebugCommand(options: BugIdCliOptions) {
  const { projectRoot, paths, defaultProvider } = await requireBugPaths(options);
  const template = loadBugTemplate(
    projectRoot,
    "DEBUG.md",
    BUILTIN_DEBUG_TEMPLATE_PT,
  );
  const { written } = ensureBugArtifact(
    projectRoot,
    paths.bugId,
    "DEBUG.md",
    template,
    { defaultProvider },
  );
  const meta = patchMeta(paths.bugDir, { status: "debugging" });
  const guidance = [
    "SDD debug — guided diagnose (host-driven)",
    "",
    "Use REPORT, failing tests, redacted logs, evidence pack, and research catalog on uncertainty.",
    "Fill DEBUG.md (hypothesis, evidence, root cause). No secrets.",
    "",
    `debug: ${paths.debugRel} (${written ? "written" : "preserved"})`,
    `meta.status: ${meta.status}`,
  ].join("\n");
  return { projectRoot, paths, meta, guidance, written };
}

export async function runQaCommand(options: BugIdCliOptions) {
  const { projectRoot, paths, defaultProvider } = await requireBugPaths(options);
  const template = loadBugTemplate(projectRoot, "QA.md", BUILTIN_QA_TEMPLATE_PT);
  const { written } = ensureBugArtifact(
    projectRoot,
    paths.bugId,
    "QA.md",
    template,
    { defaultProvider },
  );
  const meta = patchMeta(paths.bugDir, { status: "qa" });
  const guidance = [
    "SDD qa — QA checklist / sign-off (host-driven)",
    "",
    "Fill QA.md: regression matrix, severity, retest notes, checklist.",
    "Approve only when bug regression AND existing suite pass;",
    "confirm .sdd/evidence/<key>/latest/demo/ updated after fix.",
    "",
    `qa: ${paths.qaRel} (${written ? "written" : "preserved"})`,
    `meta.status: ${meta.status}`,
  ].join("\n");
  return { projectRoot, paths, meta, guidance, written };
}

export async function runFixCommand(options: BugIdCliOptions) {
  const { projectRoot, paths } = await requireBugPaths(options);
  const meta = readBugMeta(paths.bugDir);
  const hasRegression = Boolean(meta?.regressionTest);
  if (!hasRegression) {
    const guidance = [
      "SDD fix — BLOCKED (TDD for bugs)",
      "",
      "Hard rule: never fix without a failing regression first.",
      `Run: sdd reproduce ${paths.bugId}`,
      "Then set meta.json regressionTest to the failing test path,",
      "re-run sdd fix.",
      "",
      `report: ${paths.reportRel}`,
      `regressionTest: (missing)`,
    ].join("\n");
    return {
      projectRoot,
      paths,
      meta,
      guidance,
      blocked: true as const,
    };
  }

  patchMeta(paths.bugDir, { status: "fixing" });
  const guidance = [
    "SDD fix — implement loop until regression + suite green (host-driven)",
    "",
    "1. Implement against the red regression (and existing suite).",
    "2. Loop diagnose→implement→verify until green or diagnose cap.",
    "3. Update evidence pack for this evidenceKey (sdd demo / updateEvidencePack).",
    "4. Then: sdd qa <id> for sign-off.",
    "",
    `regressionTest: ${meta!.regressionTest}`,
    `evidenceKey: ${paths.evidenceKey}`,
  ].join("\n");
  return {
    projectRoot,
    paths,
    meta: readBugMeta(paths.bugDir),
    guidance,
    blocked: false as const,
  };
}

export function formatGuidanceResult(r: {
  guidance: string;
  blocked?: boolean;
}): string {
  return r.guidance;
}
