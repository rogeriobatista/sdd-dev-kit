/** Bootstrap phase: pull a ticket into draft `specs/` before `/sdd run`. */
export const FROM_TICKET_PHASE = "from-ticket" as const;

/**
 * Human-iterative surface (canonical step 1): create/adjust NL specs (+ clarifying acceptance).
 * Not part of the automated `/sdd run` loop — humans iterate here only.
 */
export const SPECS_PHASE = "specs" as const;

/**
 * Post-verify stakeholder pack presentation (`/sdd demo`).
 * Step 10 writes evidence; demo refreshes the PO/BO/QA view of that pack.
 */
export const DEMO_PHASE = "demo" as const;

/**
 * Continuous policy (canonical step 11): market / standards best practices.
 * Not a separate stop in `/sdd run` — apply during steps 2–10.
 * Also available standalone via `/sdd research`.
 */
export const RESEARCH_PHASE = "research" as const;

/**
 * Optional documentation pack after evidence (`/sdd docs`).
 * Not part of the required auto-loop; may run after step 10 or via explicit command.
 */
export const DOCS_PHASE = "docs" as const;

/**
 * Ordered automated-loop phases for `/sdd run` (canonical steps 2–10).
 * After specs are accepted, the host agent runs these without stopping to ask
 * the human to fix code. Step 9 = implement → verify → diagnose until pass or cap.
 */
export const PHASES = [
  "spec-tests",
  "dev-spec",
  "implementation-plan",
  "design-approach",
  "unit-tests",
  "integration-tests",
  "e2e-tests",
  "implement",
  "verify",
  "diagnose",
  "evidence",
] as const;

/** Alias: `/sdd run` is an auto-loop for steps 2–10 until all test levels pass (or max iterations). */
export const AUTO_LOOP_PHASES = PHASES;

/** Parallel workflow for client-reported errors (not part of canonical 1–11). */
export const BUG_REPORT_PHASE = "bug-report" as const;
export const REPRODUCE_PHASE = "reproduce" as const;
export const DEBUG_PHASE = "debug" as const;
export const QA_PHASE = "qa" as const;
export const FIX_PHASE = "fix" as const;

export const BUGFIX_PHASES = [
  BUG_REPORT_PHASE,
  REPRODUCE_PHASE,
  DEBUG_PHASE,
  QA_PHASE,
  FIX_PHASE,
] as const;

export type BugfixPhaseName = (typeof BUGFIX_PHASES)[number];

/** Phases where the human iterates (specs gate + ticket draft + bug REPORT). */
export const HUMAN_ITERATIVE_PHASES = [
  SPECS_PHASE,
  FROM_TICKET_PHASE,
  BUG_REPORT_PHASE,
] as const;

export type PhaseName = (typeof PHASES)[number];

/** All named phases including specs gate, ticket bootstrap, research, demo, docs, bugfix. */
export const ALL_PHASES = [
  SPECS_PHASE,
  FROM_TICKET_PHASE,
  ...PHASES,
  RESEARCH_PHASE,
  DEMO_PHASE,
  DOCS_PHASE,
  ...BUGFIX_PHASES,
] as const;

export type AnyPhaseName = (typeof ALL_PHASES)[number];

export type HumanIterativePhaseName = (typeof HUMAN_ITERATIVE_PHASES)[number];

export const DEFAULT_MAX_DIAGNOSE_ITERATIONS = 3;

/**
 * Locked canonical development flow (steps 1–11).
 * Step 1 = human gate; steps 2–10 = `/sdd run` auto; step 11 = continuous policy.
 */
export const CANONICAL_FLOW_STEPS = [
  {
    step: 1,
    id: "specs",
    actor: "human" as const,
    summary:
      "Natural language mixed with BDD (Cucumber-style) in specs/",
    artifact: "specs/",
  },
  {
    step: 2,
    id: "spec-tests",
    actor: "kit" as const,
    summary: "Create executable Spec Tests validating the described rules",
    artifact: "tests/spec/ or tests/features/",
  },
  {
    step: 3,
    id: "dev-spec",
    actor: "kit" as const,
    summary: "Create Dev Spec document for the implementation",
    artifact: ".sdd/dev-spec.md",
  },
  {
    step: 4,
    id: "implementation-plan",
    actor: "kit" as const,
    summary: "Create Dev Implementation Plan document",
    artifact: ".sdd/implementation-plan.md",
  },
  {
    step: 5,
    id: "design-approach",
    actor: "kit" as const,
    summary: "Create Design & Approach definitions for the implementation",
    artifact: ".sdd/design-approach.md",
  },
  {
    step: 6,
    id: "unit-tests",
    actor: "kit" as const,
    summary: "Create unit tests",
    artifact: "tests/unit/",
  },
  {
    step: 7,
    id: "integration-tests",
    actor: "kit" as const,
    summary: "Create integration tests",
    artifact: "tests/integration/",
  },
  {
    step: 8,
    id: "e2e-tests",
    actor: "kit" as const,
    summary: "Create e2e tests",
    artifact: "tests/e2e/",
  },
  {
    step: 9,
    id: "implement-verify",
    actor: "kit" as const,
    summary:
      "Develop in a loop until all test levels pass (spec + unit + integration + e2e)",
    artifact: "src/ + .sdd/runs/",
  },
  {
    step: 10,
    id: "evidence",
    actor: "kit" as const,
    summary:
      "Create evidence for the requester proving the ask was met",
    artifact: ".sdd/evidence/<key>/latest/",
  },
  {
    step: 11,
    id: "research",
    actor: "kit" as const,
    summary:
      "During all steps: any doubt → follow market best practices (research catalog; premises win on conflict)",
    artifact: ".sdd/research/<key>/",
  },
] as const;

export type CanonicalFlowStep = (typeof CANONICAL_FLOW_STEPS)[number];

export function isPhaseName(value: string): value is PhaseName {
  return (PHASES as readonly string[]).includes(value);
}

export function isAnyPhaseName(value: string): value is AnyPhaseName {
  return (ALL_PHASES as readonly string[]).includes(value);
}

export function isHumanIterativePhase(
  value: string,
): value is HumanIterativePhaseName {
  return (HUMAN_ITERATIVE_PHASES as readonly string[]).includes(value);
}

export function isAutoLoopPhase(value: string): value is PhaseName {
  return isPhaseName(value);
}
