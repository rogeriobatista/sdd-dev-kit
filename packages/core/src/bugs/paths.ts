import fs from "node:fs";
import path from "node:path";
import { encodeEvidenceKeyForPath } from "../demo/evidence-pack.js";
import { DEFAULT_PATHS } from "../paths.js";
import type { ParsedBugId } from "./parse.js";
import { evidenceKeyForBug, parseBugId } from "./parse.js";

export type BugArtifactName = "REPORT.md" | "DEBUG.md" | "QA.md" | "meta.json";

export type BugPaths = {
  bugId: string;
  kind: ParsedBugId["kind"];
  /** Path segment under `.sdd/bugs/` (colon → underscore). */
  encodedId: string;
  /** Relative POSIX: `.sdd/bugs/<encoded>/` */
  bugPath: string;
  /** Absolute bug directory. */
  bugDir: string;
  reportRel: string;
  debugRel: string;
  qaRel: string;
  metaRel: string;
  reportPath: string;
  debugPath: string;
  qaPath: string;
  metaPath: string;
  /** Aligns with `.sdd/evidence/<key>/` when ticket-linked. */
  evidenceKey: string;
  evidenceEncodedKey: string;
};

/** Encode a bug id for a single filesystem path segment (same rules as evidence). */
export function encodeBugIdForPath(bugId: string): string {
  return encodeEvidenceKeyForPath(bugId);
}

/**
 * Resolve absolute/relative paths for a bug workspace under `.sdd/bugs/<id>/`.
 */
export function resolveBugPaths(
  projectRoot: string,
  bugIdOrRaw: string | ParsedBugId,
  options?: { defaultProvider?: "linear" | "jira" },
): BugPaths {
  const parsed =
    typeof bugIdOrRaw === "string"
      ? parseBugId(bugIdOrRaw, options)
      : bugIdOrRaw;

  const root = projectRoot.replace(/\\/g, "/").replace(/\/+$/, "");
  const encodedId = encodeBugIdForPath(parsed.bugId);
  const bugPath = `${DEFAULT_PATHS.bugs}/${encodedId}`;
  const bugDir = path.join(root, DEFAULT_PATHS.bugs, encodedId);
  const reportRel = `${bugPath}/REPORT.md`;
  const debugRel = `${bugPath}/DEBUG.md`;
  const qaRel = `${bugPath}/QA.md`;
  const metaRel = `${bugPath}/meta.json`;
  const evidenceKey = evidenceKeyForBug(parsed);

  return {
    bugId: parsed.bugId,
    kind: parsed.kind,
    encodedId,
    bugPath,
    bugDir,
    reportRel,
    debugRel,
    qaRel,
    metaRel,
    reportPath: path.join(bugDir, "REPORT.md"),
    debugPath: path.join(bugDir, "DEBUG.md"),
    qaPath: path.join(bugDir, "QA.md"),
    metaPath: path.join(bugDir, "meta.json"),
    evidenceKey,
    evidenceEncodedKey: encodeEvidenceKeyForPath(evidenceKey),
  };
}

export type BugMeta = {
  bugId: string;
  kind: ParsedBugId["kind"];
  evidenceKey: string;
  encodedId: string;
  createdAt: string;
  updatedAt: string;
  ticket?: { provider: string; id: string };
  /** Relative path to a failing regression test once reproduce lands. */
  regressionTest?: string | null;
  status?:
    | "reported"
    | "reproducing"
    | "debugging"
    | "fixing"
    | "qa"
    | "closed";
};

export function readBugMeta(bugDir: string): BugMeta | null {
  const metaPath = path.join(bugDir, "meta.json");
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8")) as BugMeta;
  } catch {
    return null;
  }
}

export function writeBugMeta(bugDir: string, meta: BugMeta): void {
  fs.mkdirSync(bugDir, { recursive: true });
  fs.writeFileSync(
    path.join(bugDir, "meta.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
    "utf8",
  );
}

/** List encoded bug directory names under `.sdd/bugs/` (skips `_templates`). */
export function listBugIds(projectRoot: string): string[] {
  const dir = path.join(projectRoot, DEFAULT_PATHS.bugs);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();
}
