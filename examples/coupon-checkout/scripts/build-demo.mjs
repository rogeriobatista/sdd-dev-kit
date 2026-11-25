/**
 * Smoke helper: persist a minimal run report (if missing) and buildDemo.
 * Usage: node scripts/build-demo.mjs [runId]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDemo } from "@sdd-dev-kit/core";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runIdArg = process.argv[2];
const runsDir = path.join(projectRoot, ".sdd", "runs");
fs.mkdirSync(runsDir, { recursive: true });

let runId = runIdArg;
if (!runId) {
  const existing = fs
    .readdirSync(runsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
  if (existing.length === 0) {
    runId = `smoke-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const runDir = path.join(runsDir, runId);
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(
      path.join(runDir, "report.json"),
      JSON.stringify(
        {
          id: runId,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          status: "passed",
          phases: [{ phase: "verify", status: "passed" }],
          diagnoseIterations: 0,
          runners: [
            { name: "cucumber", exitCode: 0 },
            { name: "playwright", exitCode: 0 },
          ],
          notes: ["Synthetic report from scripts/build-demo.mjs"],
        },
        null,
        2,
      ),
      "utf8",
    );
  }
}

const result = buildDemo({ projectRoot, runId });
console.log(
  JSON.stringify(
    {
      runId: result.runId,
      evidenceKey: result.evidenceKey,
      evidencePath: result.evidencePath,
      demoDir: path.relative(projectRoot, result.demoDir),
      indexHtml: path.relative(projectRoot, result.indexHtmlPath),
      summaryMd: path.relative(projectRoot, result.summaryMdPath),
      manifest: path.relative(projectRoot, result.manifestPath),
      evidenceCount: result.manifest.evidence.length,
      missingEvidence: result.missingEvidence,
    },
    null,
    2,
  ),
);
