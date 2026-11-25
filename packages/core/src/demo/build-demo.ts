import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PATHS } from "../paths.js";
import {
  collectEvidence,
  copyEvidenceIntoDemo,
} from "./evidence.js";
import {
  resolveEvidenceKey,
  updateEvidencePack,
} from "./evidence-pack.js";
import {
  buildManifest,
  renderIndexHtml,
  renderSummaryMarkdown,
} from "./render.js";
import {
  applyResultsToFeatures,
  loadDemoFeatures,
  loadRunReport,
} from "./scenarios.js";
import type { BuildDemoOptions, BuildDemoResult } from "./types.js";

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
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

/** List run directories under `.sdd/runs/` (excluding dotfiles / .gitkeep). */
export function listRunIds(projectRoot: string): string[] {
  const runsDir = path.join(projectRoot, DEFAULT_PATHS.runs);
  if (!fs.existsSync(runsDir)) return [];
  return fs
    .readdirSync(runsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

/**
 * Resolve which run to use: explicit id, else latest by mtime, else create a
 * synthetic `adhoc-<timestamp>` folder so demo still works without a prior run.
 */
export function resolveRunId(
  projectRoot: string,
  runId?: string,
): { runId: string; runDir: string; createdPlaceholder: boolean } {
  const runsDir = path.join(projectRoot, DEFAULT_PATHS.runs);
  fs.mkdirSync(runsDir, { recursive: true });

  if (runId) {
    const runDir = path.join(runsDir, runId);
    if (!fs.existsSync(runDir)) {
      throw new Error(
        `Run id "${runId}" não encontrado em ${toPosix(path.join(DEFAULT_PATHS.runs, runId))}`,
      );
    }
    return { runId, runDir, createdPlaceholder: false };
  }

  const ids = listRunIds(projectRoot);
  if (ids.length > 0) {
    // Prefer latest mtime
    let best = ids[0]!;
    let bestMtime = 0;
    for (const id of ids) {
      const st = fs.statSync(path.join(runsDir, id));
      if (st.mtimeMs >= bestMtime) {
        bestMtime = st.mtimeMs;
        best = id;
      }
    }
    return {
      runId: best,
      runDir: path.join(runsDir, best),
      createdPlaceholder: false,
    };
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const syntheticId = `adhoc-${stamp}`;
  const runDir = path.join(runsDir, syntheticId);
  fs.mkdirSync(runDir, { recursive: true });
  return { runId: syntheticId, runDir, createdPlaceholder: true };
}

/**
 * Build a stakeholder demo pack from verify evidence + NL/canonical scenarios.
 *
 * Primary output (updated in place as development evolves):
 * `.sdd/evidence/<evidenceKey>/latest/demo/{index.html,SUMMARY.md,manifest.json,evidence/}`
 *
 * Also writes a legacy copy under `.sdd/demo/<runId>/` unless `writeLegacyDemo: false`.
 * Internal run artifacts remain under `.sdd/runs/<runId>/` and are linked from meta.json.
 */
export function buildDemo(options: BuildDemoOptions): BuildDemoResult {
  const projectRoot = path.resolve(options.projectRoot);
  const locale = options.locale ?? "pt-BR";
  const copyEvidence = options.copyEvidence !== false;
  const writeLegacy = options.writeLegacyDemo !== false;
  const skipPack = options.skipEvidencePack === true;

  const { runId, runDir, createdPlaceholder } = resolveRunId(
    projectRoot,
    options.runId,
  );

  const keyInfo = resolveEvidenceKey({
    projectRoot,
    evidenceKey: options.evidenceKey,
  });

  const collected = collectEvidence({ projectRoot, runDir });
  const runReport = loadRunReport(collected.runReportPath);
  const features = loadDemoFeatures(projectRoot);
  const applied = applyResultsToFeatures(
    features,
    collected.files,
    runReport,
  );

  // Build into a staging dir, then promote into evidence pack + optional legacy
  const stagingDir = path.join(
    projectRoot,
    DEFAULT_PATHS.evidence,
    ".staging",
    runId,
  );
  rmrf(stagingDir);
  fs.mkdirSync(stagingDir, { recursive: true });

  const evidenceFiles = copyEvidence
    ? copyEvidenceIntoDemo(collected.files, stagingDir)
    : collected.files.map((f) => ({
        ...f,
        demoRelativePath: toPosix(path.relative(stagingDir, f.absolutePath)),
      }));

  const mediaByAbs = new Map(
    evidenceFiles.map((f) => [toPosix(f.absolutePath), f]),
  );
  for (const feature of applied.features) {
    for (const scenario of feature.scenarios) {
      scenario.evidence = scenario.evidence.map(
        (e) => mediaByAbs.get(toPosix(e.absolutePath)) ?? e,
      );
    }
  }

  const generatedAt = new Date().toISOString();
  const notes = [...applied.notes];
  if (createdPlaceholder) {
    notes.push(
      "Nenhuma pasta em `.sdd/runs/` — criada execução adhoc; demo usa evidências do projeto + specs.",
    );
  }
  if (collected.files.length === 0) {
    notes.push(
      "Nenhuma evidência de relatório encontrada; narrativa montada a partir das specs/canonical.",
    );
  }
  notes.push(
    `Pacote de evidências: chave \`${keyInfo.evidenceKey}\` (${keyInfo.source}) → \`${keyInfo.evidencePath}/latest/demo/\`.`,
  );

  const renderInput = {
    runId,
    evidenceKey: keyInfo.evidenceKey,
    generatedAt,
    overallStatus: applied.overallStatus,
    features: applied.features,
    evidence: evidenceFiles,
    missingEvidence: collected.missing,
    notes,
    locale,
    projectRoot,
  };

  const indexHtml = renderIndexHtml(renderInput);
  const summaryMd = renderSummaryMarkdown(renderInput);
  const manifest = buildManifest(renderInput);

  const indexHtmlPath = path.join(stagingDir, "index.html");
  const summaryMdPath = path.join(stagingDir, "SUMMARY.md");
  const manifestPath = path.join(stagingDir, "manifest.json");

  fs.writeFileSync(indexHtmlPath, indexHtml, "utf8");
  fs.writeFileSync(summaryMdPath, summaryMd, "utf8");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  let demoDir = stagingDir;
  let evidenceMetaPath: string | undefined;
  let evidencePath = keyInfo.evidencePath;

  if (!skipPack) {
    const pack = updateEvidencePack({
      projectRoot,
      runId,
      evidenceKey: keyInfo.evidenceKey,
      demoDir: stagingDir,
      status:
        typeof applied.overallStatus === "string"
          ? applied.overallStatus
          : "unknown",
    });
    demoDir = pack.demoDir;
    evidenceMetaPath = pack.metaPath;
    evidencePath = pack.evidencePath;
  }

  if (writeLegacy) {
    const legacyDir = path.join(projectRoot, DEFAULT_PATHS.demo, runId);
    rmrf(legacyDir);
    copyRecursive(stagingDir, legacyDir);
    if (skipPack) {
      demoDir = legacyDir;
    }
  }

  // Drop staging after promotion (never leave `.staging` as the public path)
  if (demoDir !== stagingDir) {
    rmrf(path.join(projectRoot, DEFAULT_PATHS.evidence, ".staging"));
  }

  const finalIndex = path.join(demoDir, "index.html");
  const finalSummary = path.join(demoDir, "SUMMARY.md");
  const finalManifest = path.join(demoDir, "manifest.json");

  return {
    runId,
    evidenceKey: keyInfo.evidenceKey,
    evidencePath,
    demoDir,
    indexHtmlPath: finalIndex,
    summaryMdPath: finalSummary,
    manifestPath: finalManifest,
    manifest,
    missingEvidence: collected.missing,
    evidenceMetaPath,
  };
}

function rmrf(target: string): void {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}
