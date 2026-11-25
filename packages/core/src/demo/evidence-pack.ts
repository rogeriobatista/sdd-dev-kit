import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PATHS } from "../paths.js";
import { parseSddYaml, type SddManifest } from "../schema.js";
import type { TicketProvenance } from "../types.js";
import { collectEvidence } from "./evidence.js";

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

/** Characters unsafe in directory names (notably `:` on Windows). */
const UNSAFE_PATH_CHARS = /[:<>"|?*\\/]/g;

/**
 * Encode an evidence key for use as a single path segment.
 * Logical key keeps provider colon form (`linear:ENG-42`); on disk that
 * becomes `linear_ENG-42`.
 */
export function encodeEvidenceKeyForPath(evidenceKey: string): string {
  const trimmed = evidenceKey.trim();
  if (!trimmed) {
    throw new Error("evidenceKey is empty");
  }
  return trimmed.replace(UNSAFE_PATH_CHARS, "_");
}

/** Normalize / validate a key from CLI or sdd.yaml. */
export function normalizeEvidenceKey(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("evidence key is empty");
  }
  // Collapse whitespace; keep provider:ID form when present
  const collapsed = trimmed.replace(/\s+/g, "");
  if (UNSAFE_PATH_CHARS.test(collapsed.replace(/:/g, ""))) {
    throw new Error(
      `evidence key "${raw}" contains characters that are not filesystem-safe`,
    );
  }
  return collapsed;
}

export type EvidenceKeySource =
  | "override"
  | "sdd.yaml"
  | "ticket"
  | "evidence-id";

export interface EvidenceIdFile {
  id: string;
  createdAt: string;
  /** Optional short slug from feature name when generated. */
  slug?: string;
}

export interface ResolveEvidenceKeyOptions {
  projectRoot: string;
  /** CLI `/sdd demo --id <key>` or programmatic override. */
  evidenceKey?: string;
  /** Parsed sdd.yaml; when omitted, read from disk if present. */
  manifest?: SddManifest;
}

export interface ResolveEvidenceKeyResult {
  evidenceKey: string;
  source: EvidenceKeySource;
  /** Relative POSIX path to pack root: `.sdd/evidence/<encoded>/` */
  evidencePath: string;
  /** Absolute pack root. */
  evidenceDir: string;
  /** Path segment used under `.sdd/evidence/`. */
  encodedKey: string;
}

function readManifest(projectRoot: string): SddManifest | undefined {
  const yamlPath = path.join(projectRoot, DEFAULT_PATHS.manifest);
  if (!fs.existsSync(yamlPath)) return undefined;
  try {
    return parseSddYaml(fs.readFileSync(yamlPath, "utf8"));
  } catch {
    return undefined;
  }
}

function readTicketProvenance(
  projectRoot: string,
): TicketProvenance | undefined {
  const ticketPath = path.join(projectRoot, DEFAULT_PATHS.ticket);
  if (!fs.existsSync(ticketPath)) return undefined;
  try {
    const raw = JSON.parse(fs.readFileSync(ticketPath, "utf8")) as TicketProvenance;
    if (raw?.ref?.provider && raw?.ref?.id) return raw;
    return undefined;
  } catch {
    return undefined;
  }
}

function ticketEvidenceKey(provenance: TicketProvenance): string {
  if (provenance.evidenceKey) {
    return normalizeEvidenceKey(provenance.evidenceKey);
  }
  const provider = provenance.ref.provider;
  const id = provenance.ref.id.trim().toUpperCase();
  // UUID tickets stay lowercase-ish uuid; issue keys already uppercased by detect
  const normalizedId = /^[0-9A-F-]{36}$/i.test(provenance.ref.id)
    ? provenance.ref.id.toLowerCase()
    : id;
  return `${provider}:${normalizedId}`;
}

function ensureLocalEvidenceId(projectRoot: string): EvidenceIdFile {
  const idPath = path.join(projectRoot, DEFAULT_PATHS.evidenceId);
  if (fs.existsSync(idPath)) {
    try {
      const existing = JSON.parse(
        fs.readFileSync(idPath, "utf8"),
      ) as EvidenceIdFile;
      if (existing?.id && typeof existing.id === "string") {
        return existing;
      }
    } catch {
      /* regenerate */
    }
  }

  const created: EvidenceIdFile = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(idPath), { recursive: true });
  fs.writeFileSync(idPath, `${JSON.stringify(created, null, 2)}\n`, "utf8");
  return created;
}

/**
 * Resolve the stable evidence key for this project/feature scope.
 *
 * Priority:
 * 1. Explicit override (`evidenceKey` / CLI `--id`)
 * 2. `sdd.yaml` `evidence.key`
 * 3. `.sdd/ticket.json` → `linear:ENG-42` / `jira:SHOP-7`
 * 4. Persist/reuse `.sdd/evidence-id.json` → `local:<uuid>`
 */
export function resolveEvidenceKey(
  options: ResolveEvidenceKeyOptions,
): ResolveEvidenceKeyResult {
  const projectRoot = path.resolve(options.projectRoot);
  const manifest = options.manifest ?? readManifest(projectRoot);

  let evidenceKey: string;
  let source: EvidenceKeySource;

  if (options.evidenceKey?.trim()) {
    evidenceKey = normalizeEvidenceKey(options.evidenceKey);
    source = "override";
  } else if (manifest?.evidence?.key?.trim()) {
    evidenceKey = normalizeEvidenceKey(manifest.evidence.key);
    source = "sdd.yaml";
  } else {
    const ticket = readTicketProvenance(projectRoot);
    if (ticket) {
      evidenceKey = ticketEvidenceKey(ticket);
      source = "ticket";
    } else {
      const local = ensureLocalEvidenceId(projectRoot);
      evidenceKey = `local:${local.id}`;
      source = "evidence-id";
    }
  }

  const encodedKey = encodeEvidenceKeyForPath(evidenceKey);
  const evidenceRootRel =
    manifest?.paths?.evidence ?? DEFAULT_PATHS.evidence;
  const evidencePath = toPosix(path.join(evidenceRootRel, encodedKey));
  const evidenceDir = path.join(projectRoot, evidencePath);

  return {
    evidenceKey,
    source,
    evidencePath,
    evidenceDir,
    encodedKey,
  };
}

export interface EvidencePackMeta {
  version: 1;
  evidenceKey: string;
  encodedKey: string;
  updatedAt: string;
  lastRunId: string;
  status: string;
  /** Internal run folder linked from this pack. */
  runPath: string;
  ticket?: {
    provider: string;
    id: string;
    url?: string;
    title?: string;
  };
  history?: string[];
  notes?: string[];
}

export interface UpdateEvidencePackOptions {
  projectRoot: string;
  runId: string;
  /** Override key (same as resolveEvidenceKey). */
  evidenceKey?: string;
  manifest?: SddManifest;
  /**
   * Absolute path to a demo pack directory to copy into `latest/demo/`.
   * When omitted, only raw artifacts + meta are updated (verify post-hook).
   */
  demoDir?: string;
  /** Overall status for meta (default: from run report or `unknown`). */
  status?: string;
  /** Max history snapshots to retain (default: sdd.yaml or 5). */
  historyLimit?: number;
}

export interface UpdateEvidencePackResult {
  evidenceKey: string;
  evidencePath: string;
  evidenceDir: string;
  latestDir: string;
  demoDir: string;
  metaPath: string;
  meta: EvidencePackMeta;
  source: EvidenceKeySource;
}

function rmrf(target: string): void {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function copyRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  const st = fs.statSync(src);
  if (st.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return;
  }
  if (!st.isDirectory()) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    copyRecursive(path.join(src, entry.name), path.join(dest, entry.name));
  }
}

function readRunStatus(runDir: string): string {
  for (const name of ["report.json", "run.json"]) {
    const p = path.join(runDir, name);
    if (!fs.existsSync(p)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(p, "utf8")) as {
        status?: string;
      };
      if (raw.status) return String(raw.status);
    } catch {
      /* ignore */
    }
  }
  return "unknown";
}

function copyRawArtifacts(
  projectRoot: string,
  runDir: string,
  rawDir: string,
): void {
  rmrf(rawDir);
  fs.mkdirSync(rawDir, { recursive: true });

  const collected = collectEvidence({ projectRoot, runDir });
  for (const [index, file] of collected.files.entries()) {
    if (file.kind === "run-report") continue;
    const safeBase = path
      .basename(file.absolutePath)
      .replace(/[^\w.\-]+/g, "_");
    const destName = `${String(index).padStart(3, "0")}-${file.kind}-${safeBase}`;
    try {
      fs.copyFileSync(file.absolutePath, path.join(rawDir, destName));
    } catch {
      /* skip unreadable */
    }
  }

  // Always mirror the run report into latest/
  for (const name of ["report.json", "run.json"]) {
    const src = path.join(runDir, name);
    if (fs.existsSync(src) && fs.statSync(src).isFile()) {
      fs.copyFileSync(src, path.join(path.dirname(rawDir), "run-report.json"));
      break;
    }
  }
}

function pruneHistory(historyDir: string, keep: number): string[] {
  if (!fs.existsSync(historyDir) || keep <= 0) {
    if (keep <= 0 && fs.existsSync(historyDir)) {
      rmrf(historyDir);
      fs.mkdirSync(historyDir, { recursive: true });
    }
    return [];
  }
  const entries = fs
    .readdirSync(historyDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => {
      const full = path.join(historyDir, d.name);
      return { name: d.name, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  const kept = entries.slice(0, keep).map((e) => e.name);
  for (const e of entries.slice(keep)) {
    rmrf(path.join(historyDir, e.name));
  }
  return kept;
}

/**
 * Update (in place) the stakeholder evidence pack for a key.
 *
 * Layout:
 * ```
 * .sdd/evidence/<encodedKey>/
 *   meta.json
 *   latest/{ run-report.json, demo/, raw/ }
 *   history/<runId>/   # last N snapshots
 * ```
 */
export function updateEvidencePack(
  options: UpdateEvidencePackOptions,
): UpdateEvidencePackResult {
  const projectRoot = path.resolve(options.projectRoot);
  const resolved = resolveEvidenceKey({
    projectRoot,
    evidenceKey: options.evidenceKey,
    manifest: options.manifest,
  });

  const manifest = options.manifest ?? readManifest(projectRoot);
  const historyLimit =
    options.historyLimit ??
    manifest?.evidence?.historyLimit ??
    5;

  const runDir = path.join(projectRoot, DEFAULT_PATHS.runs, options.runId);
  if (!fs.existsSync(runDir)) {
    throw new Error(
      `Run id "${options.runId}" não encontrado em ${toPosix(
        path.join(DEFAULT_PATHS.runs, options.runId),
      )}`,
    );
  }

  const packDir = resolved.evidenceDir;
  const latestDir = path.join(packDir, "latest");
  const historyDir = path.join(packDir, "history");
  const demoOut = path.join(latestDir, "demo");
  const rawDir = path.join(latestDir, "raw");

  fs.mkdirSync(latestDir, { recursive: true });
  fs.mkdirSync(historyDir, { recursive: true });

  // Snapshot current latest into history before overwrite (when prior content exists)
  const hadLatest =
    fs.existsSync(path.join(latestDir, "meta-snapshot.json")) ||
    fs.existsSync(demoOut) ||
    fs.existsSync(path.join(latestDir, "run-report.json"));

  // Read previous meta for lastRunId before we overwrite
  const metaPath = path.join(packDir, "meta.json");
  let previousRunId: string | undefined;
  if (fs.existsSync(metaPath)) {
    try {
      const prev = JSON.parse(
        fs.readFileSync(metaPath, "utf8"),
      ) as EvidencePackMeta;
      previousRunId = prev.lastRunId;
    } catch {
      /* ignore */
    }
  }

  if (
    hadLatest &&
    previousRunId &&
    previousRunId !== options.runId &&
    historyLimit > 0
  ) {
    const snapDest = path.join(historyDir, previousRunId);
    rmrf(snapDest);
    fs.mkdirSync(snapDest, { recursive: true });
    // Copy current latest contents into history/<previousRunId>/
    for (const name of fs.readdirSync(latestDir)) {
      copyRecursive(path.join(latestDir, name), path.join(snapDest, name));
    }
  }

  // Refresh latest raw + run-report
  copyRawArtifacts(projectRoot, runDir, rawDir);

  // Refresh demo when provided
  if (options.demoDir) {
    rmrf(demoOut);
    copyRecursive(options.demoDir, demoOut);
  } else {
    fs.mkdirSync(demoOut, { recursive: true });
  }

  const status = options.status ?? readRunStatus(runDir);
  const ticket = readTicketProvenance(projectRoot);
  const updatedAt = new Date().toISOString();

  const historyKept = pruneHistory(historyDir, historyLimit);

  const meta: EvidencePackMeta = {
    version: 1,
    evidenceKey: resolved.evidenceKey,
    encodedKey: resolved.encodedKey,
    updatedAt,
    lastRunId: options.runId,
    status,
    runPath: toPosix(path.join(DEFAULT_PATHS.runs, options.runId)),
    history: historyKept,
  };

  if (ticket) {
    meta.ticket = {
      provider: ticket.ref.provider ?? ticket.ticket.provider,
      id: ticket.ref.id,
      url: ticket.ticket.url,
      title: ticket.ticket.title,
    };
  }

  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  // Also stamp a tiny snapshot marker inside latest for history detection
  fs.writeFileSync(
    path.join(latestDir, "meta-snapshot.json"),
    `${JSON.stringify(
      {
        evidenceKey: meta.evidenceKey,
        lastRunId: meta.lastRunId,
        updatedAt: meta.updatedAt,
        status: meta.status,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  // Keep ticket provenance in sync with evidence key/path
  if (ticket) {
    const next: TicketProvenance = {
      ...ticket,
      evidenceKey: resolved.evidenceKey,
      evidencePath: resolved.evidencePath,
    };
    fs.writeFileSync(
      path.join(projectRoot, DEFAULT_PATHS.ticket),
      `${JSON.stringify(next, null, 2)}\n`,
      "utf8",
    );
  }

  return {
    evidenceKey: resolved.evidenceKey,
    evidencePath: resolved.evidencePath,
    evidenceDir: packDir,
    latestDir,
    demoDir: demoOut,
    metaPath,
    meta,
    source: resolved.source,
  };
}

/** Relative stakeholder entry path for host instructions. */
export function stakeholderDemoRelPath(evidenceKey: string): string {
  const encoded = encodeEvidenceKeyForPath(normalizeEvidenceKey(evidenceKey));
  return toPosix(
    path.join(DEFAULT_PATHS.evidence, encoded, "latest", "demo", "index.html"),
  );
}
