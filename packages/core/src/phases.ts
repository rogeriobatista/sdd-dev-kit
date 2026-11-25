/** Bootstrap phase: pull a ticket into draft `specs/` before `/sdd run`. */
export const FROM_TICKET_PHASE = "from-ticket" as const;

/**
 * Post-verify command: build a stakeholder demo pack from test evidence.
 * Invoked via `/sdd demo` (not part of the automatic `/sdd run` loop).
 */
export const DEMO_PHASE = "demo" as const;

/**
 * Optional standalone: refresh best-practices research without a full run.
 * Also runs as an ordered phase inside `/sdd run` (see PHASES).
 */
export const RESEARCH_PHASE = "research" as const;

/** Ordered pipeline phases for `/sdd run`. */
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

export type PhaseName = (typeof PHASES)[number];

/** All named phases including ticket bootstrap, research alias, and demo. */
export const ALL_PHASES = [
  FROM_TICKET_PHASE,
  ...PHASES,
  DEMO_PHASE,
] as const;

export type AnyPhaseName = (typeof ALL_PHASES)[number];

export const DEFAULT_MAX_DIAGNOSE_ITERATIONS = 3;

export function isPhaseName(value: string): value is PhaseName {
  return (PHASES as readonly string[]).includes(value);
}

export function isAnyPhaseName(value: string): value is AnyPhaseName {
  return (ALL_PHASES as readonly string[]).includes(value);
}
