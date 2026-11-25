import { PHASES } from "@rogeriobatista/core";
import { formatStatusReport, runStatus } from "./status.js";

export type RunOptions = {
  projectRoot?: string;
};

/**
 * `sdd run` — orchestration / docs / status.
 * Heavy LLM phases (normalize → implement) stay host-driven
 * (Cursor `/sdd run`, Claude/Copilot `SDD: run`).
 */
export async function runPipelineCommand(options: RunOptions = {}): Promise<{
  statusText: string;
  guidance: string;
  exitCode: number;
}> {
  const status = await runStatus(options);
  const statusText = formatStatusReport(status);

  const guidance = [
    "",
    "Pipeline phases (host agent owns LLM work):",
    ...PHASES.map((p, i) => `  ${i + 1}. ${p}`),
    "",
    "CLI can already:",
    "  - sdd init / sdd from-ticket  (scaffold + ticket bootstrap)",
    "  - sdd verify                 (runners from sdd.yaml)",
    "  - sdd demo                   (PO/BO/QA evidence pack)",
    "  - sdd status                 (this report)",
    "",
    "For normalize → executable → plan → implement → diagnose, invoke the",
    "host adapter in Cursor/Claude/Copilot (`/sdd run` or `SDD: run`).",
  ].join("\n");

  const exitCode = status.stack.needsClarification ? 2 : 0;
  return { statusText, guidance, exitCode };
}
