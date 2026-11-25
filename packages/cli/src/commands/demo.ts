import { buildDemo, type BuildDemoResult } from "@rogeriobatista/core";
import { resolveProjectRoot } from "../project.js";

export type DemoOptions = {
  projectRoot?: string;
  runId?: string;
  evidenceKey?: string;
};

export async function runDemoCommand(
  options: DemoOptions = {},
): Promise<BuildDemoResult> {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  return buildDemo({
    projectRoot,
    runId: options.runId,
    evidenceKey: options.evidenceKey,
  });
}

export function formatDemoReport(result: BuildDemoResult): string {
  return [
    `sdd demo → evidence pack`,
    `runId: ${result.runId}`,
    `evidenceKey: ${result.evidenceKey}`,
    `evidencePath: ${result.evidencePath}`,
    `demoDir: ${result.demoDir}`,
    `index: ${result.indexHtmlPath}`,
    "",
    "Open index.html for PO/BO/QA (offline-friendly).",
  ].join("\n");
}
