import {
  AUTO_LOOP_PHASES,
  DEFAULT_MAX_DIAGNOSE_ITERATIONS,
  HUMAN_ITERATIVE_PHASES,
} from "@rogeriobatista/core";
import { formatStatusReport, runStatus } from "./status.js";

export type RunOptions = {
  projectRoot?: string;
};

/**
 * `sdd run` — orchestration / docs / status.
 * Heavy LLM phases stay host-driven (Cursor `/sdd run`, Claude/Copilot `SDD: run`).
 * Semantics: human iterates only on specs; `/sdd run` is an automated loop until
 * spec tests pass (or diagnose cap).
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
    "SDD pipeline semantics:",
    "  Human gate (ONLY): specs/ — create/adjust NL scenarios + clarify acceptance",
    `  Human-iterative phases: ${HUMAN_ITERATIVE_PHASES.join(", ")}`,
    "  Auto-loop (no mid-loop human code fixes): after specs are accepted,",
    ...AUTO_LOOP_PHASES.map((p, i) => `    ${i + 1}. ${p}`),
    `  diagnose→implement→verify until green or loop.maxDiagnoseIterations (default ${DEFAULT_MAX_DIAGNOSE_ITERATIONS}).`,
    "  If specs are wrong/ambiguous → exit loop and ask human to edit specs/.",
    "  demo / evidence update runs after green (or after the loop ends with a report).",
    "",
    "CLI can already:",
    "  - sdd init / sdd from-ticket  (scaffold + ticket bootstrap → pause for specs)",
    "  - sdd verify                 (runners from sdd.yaml)",
    "  - sdd demo                   (PO/BO/QA evidence pack)",
    "  - sdd status                 (this report)",
    "",
    "For the auto-loop (normalize → … → diagnose), invoke the host adapter",
    "in Cursor/Claude/Copilot (`/sdd run` or `SDD: run`).",
    "Optional standalone research: `/sdd research` / `SDD: research`.",
  ].join("\n");

  const exitCode = status.stack.needsClarification ? 2 : 0;
  return { statusText, guidance, exitCode };
}
