import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PATHS } from "../paths.js";
import {
  collectEvidence,
  copyEvidenceIntoDemo,
} from "./evidence.js";
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
 * Output: `.sdd/demo/<runId>/{index.html,SUMMARY.md,manifest.json,evidence/}`
 */
export function buildDemo(options: BuildDemoOptions): BuildDemoResult {
  const projectRoot = path.resolve(options.projectRoot);
  const locale = options.locale ?? "pt-BR";
  const copyEvidence = options.copyEvidence !== false;

  const { runId, runDir, createdPlaceholder } = resolveRunId(
    projectRoot,
    options.runId,
  );

  const collected = collectEvidence({ projectRoot, runDir });
  const runReport = loadRunReport(collected.runReportPath);
  const features = loadDemoFeatures(projectRoot);
  const applied = applyResultsToFeatures(
    features,
    collected.files,
    runReport,
  );

  const demoDir = path.join(projectRoot, DEFAULT_PATHS.demo, runId);
  fs.mkdirSync(demoDir, { recursive: true });

  const evidenceFiles = copyEvidence
    ? copyEvidenceIntoDemo(collected.files, demoDir)
    : collected.files.map((f) => ({
        ...f,
        // Relative from demo dir up to project evidence
        demoRelativePath: toPosix(path.relative(demoDir, f.absolutePath)),
      }));

  // Re-attach demo-relative media onto scenarios
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

  const renderInput = {
    runId,
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

  const indexHtmlPath = path.join(demoDir, "index.html");
  const summaryMdPath = path.join(demoDir, "SUMMARY.md");
  const manifestPath = path.join(demoDir, "manifest.json");

  fs.writeFileSync(indexHtmlPath, indexHtml, "utf8");
  fs.writeFileSync(summaryMdPath, summaryMd, "utf8");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    runId,
    demoDir,
    indexHtmlPath,
    summaryMdPath,
    manifestPath,
    manifest,
    missingEvidence: collected.missing,
  };
}
