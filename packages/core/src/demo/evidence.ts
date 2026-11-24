import fs from "node:fs";
import path from "node:path";
import type { EvidenceFile, EvidenceKind } from "./types.js";

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function relFromRoot(projectRoot: string, absolutePath: string): string {
  return toPosix(path.relative(projectRoot, absolutePath));
}

function exists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function pushIfFile(
  out: EvidenceFile[],
  projectRoot: string,
  absolutePath: string,
  kind: EvidenceKind,
  label: string,
): void {
  if (!exists(absolutePath) || !fs.statSync(absolutePath).isFile()) return;
  out.push({
    kind,
    absolutePath,
    relativePath: relFromRoot(projectRoot, absolutePath),
    label,
  });
}

function walkFiles(dir: string, filter: (name: string) => boolean): string[] {
  if (!exists(dir) || !fs.statSync(dir).isDirectory()) return [];
  const found: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && filter(e.name)) found.push(full);
    }
  }
  return found;
}

/**
 * Known evidence locations per stack adapter.
 * Paths are relative to the project root unless under the run directory.
 */
export const EVIDENCE_CANDIDATES: Array<{
  kind: EvidenceKind;
  label: string;
  /** Relative to project root. */
  paths: string[];
  /** Also look under `.sdd/runs/<runId>/`. */
  underRun?: string[];
}> = [
  {
    kind: "cucumber-json",
    label: "Cucumber JSON",
    paths: ["reports/cucumber.json", "cucumber-report.json"],
    underRun: ["cucumber.json", "reports/cucumber.json"],
  },
  {
    kind: "cucumber-html",
    label: "Cucumber HTML",
    paths: ["reports/cucumber.html", "cucumber-report.html"],
    underRun: ["cucumber.html", "reports/cucumber.html"],
  },
  {
    kind: "playwright-html",
    label: "Playwright HTML report",
    paths: ["playwright-report/index.html"],
    underRun: ["playwright-report/index.html"],
  },
  {
    kind: "playwright-json",
    label: "Playwright JSON",
    paths: ["reports/playwright.json", "playwright-report/results.json"],
    underRun: ["playwright.json", "reports/playwright.json"],
  },
  {
    kind: "pytest-junit",
    label: "pytest JUnit XML",
    paths: ["reports/junit.xml", "junit.xml", "reports/pytest-junit.xml"],
    underRun: ["junit.xml", "reports/junit.xml"],
  },
  {
    kind: "pytest-html",
    label: "pytest HTML",
    paths: ["reports/report.html", "reports/pytest.html"],
    underRun: ["pytest.html", "reports/report.html"],
  },
  {
    kind: "vitest-json",
    label: "Vitest JSON",
    paths: ["reports/vitest.json", "vitest-report.json"],
    underRun: ["vitest.json", "reports/vitest.json"],
  },
  {
    kind: "terraform-log",
    label: "Terraform test log",
    paths: ["reports/terraform-test.log"],
    underRun: ["terraform-test.log", "terraform.log"],
  },
];

export interface CollectEvidenceOptions {
  projectRoot: string;
  runDir: string;
}

export interface CollectEvidenceResult {
  files: EvidenceFile[];
  /** Human-readable labels for candidates that were not found. */
  missing: string[];
  runReportPath: string | null;
}

/** Collect known report / media files for a verify run. */
export function collectEvidence(options: CollectEvidenceOptions): CollectEvidenceResult {
  const root = options.projectRoot;
  const runDir = options.runDir;
  const files: EvidenceFile[] = [];
  const missing: string[] = [];

  const reportCandidates = [
    path.join(runDir, "report.json"),
    path.join(runDir, "run.json"),
  ];
  let runReportPath: string | null = null;
  for (const p of reportCandidates) {
    if (exists(p) && fs.statSync(p).isFile()) {
      runReportPath = p;
      pushIfFile(files, root, p, "run-report", "Relatório SDD da execução");
      break;
    }
  }
  if (!runReportPath) missing.push("Relatório SDD (.sdd/runs/<id>/report.json)");

  for (const candidate of EVIDENCE_CANDIDATES) {
    let found = false;
    for (const rel of candidate.paths) {
      const abs = path.join(root, rel);
      if (exists(abs)) {
        if (fs.statSync(abs).isFile()) {
          pushIfFile(files, root, abs, candidate.kind, candidate.label);
          found = true;
        } else if (
          candidate.kind === "playwright-html" &&
          fs.statSync(abs).isDirectory()
        ) {
          const index = path.join(abs, "index.html");
          if (exists(index)) {
            pushIfFile(files, root, index, candidate.kind, candidate.label);
            found = true;
          }
        }
      }
    }
    for (const rel of candidate.underRun ?? []) {
      const abs = path.join(runDir, rel);
      if (exists(abs) && fs.statSync(abs).isFile()) {
        pushIfFile(files, root, abs, candidate.kind, candidate.label);
        found = true;
      }
    }
    if (!found) missing.push(candidate.label);
  }

  // Playwright media under test-results/
  const testResults = path.join(root, "test-results");
  for (const shot of walkFiles(testResults, (n) =>
    /\.(png|jpe?g|webp)$/i.test(n),
  )) {
    pushIfFile(files, root, shot, "screenshot", `Screenshot: ${path.basename(shot)}`);
  }
  for (const vid of walkFiles(testResults, (n) => /\.(webm|mp4)$/i.test(n))) {
    pushIfFile(files, root, vid, "video", `Vídeo: ${path.basename(vid)}`);
  }
  for (const trace of walkFiles(testResults, (n) => /\.zip$/i.test(n) && /trace/i.test(n))) {
    pushIfFile(files, root, trace, "playwright-trace", `Trace: ${path.basename(trace)}`);
  }

  // Also copy media that may already live under the run folder
  for (const shot of walkFiles(runDir, (n) => /\.(png|jpe?g|webp)$/i.test(n))) {
    pushIfFile(files, root, shot, "screenshot", `Screenshot: ${path.basename(shot)}`);
  }
  for (const vid of walkFiles(runDir, (n) => /\.(webm|mp4)$/i.test(n))) {
    pushIfFile(files, root, vid, "video", `Vídeo: ${path.basename(vid)}`);
  }

  // Deduplicate by absolute path
  const seen = new Set<string>();
  const deduped = files.filter((f) => {
    const key = toPosix(f.absolutePath);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { files: deduped, missing, runReportPath };
}

/** Copy evidence into demoDir/evidence/ and set demoRelativePath. */
export function copyEvidenceIntoDemo(
  files: EvidenceFile[],
  demoDir: string,
): EvidenceFile[] {
  const evidenceRoot = path.join(demoDir, "evidence");
  fs.mkdirSync(evidenceRoot, { recursive: true });
  return files.map((file, index) => {
    const safeBase = path
      .basename(file.absolutePath)
      .replace(/[^\w.\-]+/g, "_");
    const destName = `${String(index).padStart(3, "0")}-${file.kind}-${safeBase}`;
    const destAbs = path.join(evidenceRoot, destName);
    try {
      fs.copyFileSync(file.absolutePath, destAbs);
    } catch {
      // If copy fails (e.g. directory html report assets), keep original relative link
      return {
        ...file,
        demoRelativePath: toPosix(path.relative(demoDir, file.absolutePath)),
      };
    }
    // For Playwright HTML index, also try to copy sibling assets folder when small
    if (file.kind === "playwright-html") {
      const srcDir = path.dirname(file.absolutePath);
      const destAssets = path.join(evidenceRoot, `${String(index).padStart(3, "0")}-playwright-assets`);
      try {
        copyDirShallow(srcDir, destAssets);
      } catch {
        /* ignore */
      }
    }
    return {
      ...file,
      demoRelativePath: toPosix(path.relative(demoDir, destAbs)),
    };
  });
}

function copyDirShallow(src: string, dest: string): void {
  if (!exists(src) || !fs.statSync(src).isDirectory()) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isFile()) fs.copyFileSync(from, to);
    else if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      // one level of nested assets (data/, trace/, etc.)
      for (const nested of fs.readdirSync(from, { withFileTypes: true })) {
        const nFrom = path.join(from, nested.name);
        const nTo = path.join(to, nested.name);
        if (nested.isFile()) fs.copyFileSync(nFrom, nTo);
      }
    }
  }
}
