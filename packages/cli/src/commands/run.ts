import {
  CANONICAL_FLOW_STEPS,
  DEFAULT_MAX_DIAGNOSE_ITERATIONS,
  HUMAN_ITERATIVE_PHASES,
  PHASES,
} from "@rogeriobatista/core";
import { formatStatusReport, runStatus } from "./status.js";

export type RunOptions = {
  projectRoot?: string;
};

/**
 * `sdd run` — orchestration / docs / status.
 * Heavy LLM phases stay host-driven (Cursor `/sdd run`, Claude/Copilot `SDD: run`).
 * Semantics: human iterates only on specs (step 1); `/sdd run` automates steps 2–10
 * until all test levels pass (or diagnose cap). Step 11 = continuous best practices.
 */
export async function runPipelineCommand(options: RunOptions = {}): Promise<{
  statusText: string;
  guidance: string;
  exitCode: number;
}> {
  const status = await runStatus(options);
  const statusText = formatStatusReport(status);

  const stepLines = CANONICAL_FLOW_STEPS.map((s) => {
    const who = s.actor === "human" ? "Human" : "Kit";
    return `    ${s.step}. [${who}] ${s.summary} → ${s.artifact}`;
  });

  const guidance = [
    "",
    "SDD canonical flow (steps 1–11):",
    ...stepLines,
    "",
    "  Human gate (ONLY): step 1 — specs/ (+ clarifying acceptance)",
    `  Human-iterative phases: ${HUMAN_ITERATIVE_PHASES.join(", ")}`,
    "  Auto-loop phases (steps 2–10, no mid-loop human code fixes):",
    ...PHASES.map((p, i) => `    ${i + 2}. ${p}`),
    `  Step 9 loops implement→verify→diagnose until green or maxDiagnoseIterations (default ${DEFAULT_MAX_DIAGNOSE_ITERATIONS}).`,
    "  Step 11 (research/best practices) is continuous during 2–10 — not a separate stop.",
    "  If specs are wrong/ambiguous → exit loop and ask human to edit specs/.",
    "",
    "CLI can already:",
    "  - sdd init / sdd from-ticket  (scaffold + ticket bootstrap → pause for specs)",
    "  - sdd verify                 (runners: all / spec / unit / integration / e2e)",
    "  - sdd demo                   (PO/BO/QA evidence pack)",
    "  - sdd docs                   (professional docs pack under docs/sdd/)",
    "  - sdd status                 (this report)",
    "",
    "For steps 2–10, invoke the host adapter in Cursor/Claude/Copilot",
    "(`/sdd run` or `SDD: run`). Optional after evidence: `/sdd docs`.",
    "Optional standalone research: `/sdd research`.",
  ].join("\n");

  const exitCode = status.stack.needsClarification ? 2 : 0;
  return { statusText, guidance, exitCode };
}
