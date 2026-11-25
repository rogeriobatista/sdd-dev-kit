/** Bootstrap phase: pull a ticket into draft `specs/` before `/sdd run`. */
export const FROM_TICKET_PHASE = "from-ticket" as const;

/**
 * Human-iterative surface: create/adjust NL specs (+ clarifying acceptance).
 * Not part of the automated `/sdd run` loop — humans iterate here only.
 */
export const SPECS_PHASE = "specs" as const;

/**
 * Post-verify command: build a stakeholder demo pack from test evidence.
 * Invoked via `/sdd demo` after green (or after the auto-loop ends with a report).
 * Not part of the automatic `/sdd run` loop body.
 */
export const DEMO_PHASE = "demo" as const;

/**
 * Optional standalone: refresh best-practices research without a full run.
 * Also runs as an ordered phase inside `/sdd run` (see PHASES / AUTO_LOOP_PHASES).
 */
export const RESEARCH_PHASE = "research" as const;

/**
 * Ordered automated-loop phases for `/sdd run`.
 * After specs are accepted, the host agent runs these without stopping to ask
 * the human to fix code. diagnose→implement→verify loops until pass or cap.
 */
export const PHASES = [
  "normalize",
  "executable",
  "research",
  "plan",
  "implement",
  "verify",
  "diagnose",
  "report",
] as const;

/** Alias: `/sdd run` is an auto-loop until spec tests pass (or max iterations). */
export const AUTO_LOOP_PHASES = PHASES;

/** Phases where the human iterates (specs gate + ticket draft bootstrap). */
export const HUMAN_ITERATIVE_PHASES = [
  SPECS_PHASE,
  FROM_TICKET_PHASE,
] as const;

export type PhaseName = (typeof PHASES)[number];

/** All named phases including specs gate, ticket bootstrap, research alias, and demo. */
export const ALL_PHASES = [
  SPECS_PHASE,
  FROM_TICKET_PHASE,
  ...PHASES,
  DEMO_PHASE,
] as const;

export type AnyPhaseName = (typeof ALL_PHASES)[number];

export type HumanIterativePhaseName = (typeof HUMAN_ITERATIVE_PHASES)[number];

export const DEFAULT_MAX_DIAGNOSE_ITERATIONS = 3;

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
