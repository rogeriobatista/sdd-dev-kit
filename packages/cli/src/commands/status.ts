import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_PATHS,
  detectStack,
  listBugIds,
  listRunIds,
  resolveEvidenceKey,
  resolveSddPath,
} from "@rogeriobatista/core";
import { pathExists } from "../fs-utils.js";
import { loadManifest, resolveProjectRoot } from "../project.js";

export type StatusOptions = {
  projectRoot?: string;
};

export type StatusReport = {
  projectRoot: string;
  hasManifest: boolean;
  adapter: string | null;
  stack: {
    id: string | null;
    source: string;
    confidence: string;
    needsClarification: boolean;
    warnings: string[];
  };
  runs: string[];
  latestRun: string | null;
  ticket: unknown | null;
  evidenceKey: string | null;
  evidencePath: string | null;
  bugs: string[];
  premisesExists: boolean;
  specsCount: number;
};

async function countSpecs(projectRoot: string, specsRel: string): Promise<number> {
  const dir = resolveSddPath(projectRoot, specsRel);
  if (!(await pathExists(dir))) return 0;
  const entries = await readdir(dir);
  return entries.filter((e) => e.endsWith(".md") && !e.startsWith("_")).length;
}

async function readJsonIfExists(filePath: string): Promise<unknown | null> {
  try {
    const text = await readFile(filePath, "utf8");
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function latestByMtime(
  projectRoot: string,
  runIds: string[],
): Promise<string | null> {
  if (!runIds.length) return null;
  let best: string | null = null;
  let bestMs = -1;
  for (const id of runIds) {
    const p = path.join(projectRoot, DEFAULT_PATHS.runs, id);
    try {
      const s = await stat(p);
      if (s.mtimeMs >= bestMs) {
        bestMs = s.mtimeMs;
        best = id;
      }
    } catch {
      // skip
    }
  }
  return best;
}

export async function runStatus(
  options: StatusOptions = {},
): Promise<StatusReport> {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const manifest = await loadManifest(projectRoot);
  const detection = detectStack(projectRoot);
  const runs = listRunIds(projectRoot);
  const latestRun = await latestByMtime(projectRoot, runs);
  const ticket = await readJsonIfExists(
    resolveSddPath(projectRoot, DEFAULT_PATHS.ticket),
  );

  let evidenceKey: string | null = null;
  let evidencePath: string | null = null;
  try {
    const resolved = resolveEvidenceKey({ projectRoot });
    evidenceKey = resolved.evidenceKey;
    evidencePath = resolved.evidencePath;
  } catch {
    // optional
  }

  const premisesExists = await pathExists(
    resolveSddPath(
      projectRoot,
      manifest?.paths.premises ?? DEFAULT_PATHS.premises,
    ),
  );
  const specsCount = await countSpecs(
    projectRoot,
    manifest?.paths.specs ?? DEFAULT_PATHS.specs,
  );

  return {
    projectRoot,
    hasManifest: Boolean(manifest),
    adapter: manifest?.adapter ?? detection.stack,
    stack: {
      id: detection.stack,
      source: detection.source,
      confidence: detection.confidence,
      needsClarification: detection.needsClarification,
      warnings: detection.warnings,
    },
    runs,
    latestRun,
    ticket,
    evidenceKey,
    evidencePath,
    bugs: listBugIds(projectRoot),
    premisesExists,
    specsCount,
  };
}

export function formatStatusReport(s: StatusReport): string {
  const lines = [
    `sdd status → ${s.projectRoot}`,
    `sdd.yaml: ${s.hasManifest ? "yes" : "no"}`,
    `adapter: ${s.adapter ?? "(none)"}`,
    `stack: ${s.stack.id ?? "(undeclared)"} (source=${s.stack.source}, confidence=${s.stack.confidence})`,
    `premises: ${s.premisesExists ? "yes" : "no"}`,
    `specs (non-example): ${s.specsCount}`,
    `runs: ${s.runs.length ? s.runs.join(", ") : "(none)"}`,
    `latestRun: ${s.latestRun ?? "(none)"}`,
    `ticket: ${s.ticket ? "yes (.sdd/ticket.json)" : "no"}`,
    `evidenceKey: ${s.evidenceKey ?? "(none)"}`,
    `evidencePath: ${s.evidencePath ?? "(none)"}`,
    `bugs: ${s.bugs.length ? s.bugs.join(", ") : "(none)"}`,
  ];
  if (s.stack.needsClarification) {
    lines.push(
      "",
      "⚠ Stack needs clarification — declare ## Stack in .sdd/premises.md",
    );
  }
  for (const w of s.stack.warnings) {
    lines.push(`warning: ${w}`);
  }
  return lines.join("\n");
}
