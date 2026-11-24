/** Bootstrap phase: pull a ticket into draft `specs/` before `/sdd run`. */
export const FROM_TICKET_PHASE = "from-ticket" as const;

/** Ordered pipeline phases for `/sdd run`. */
export const PHASES = [
  "normalize",
  "executable",
  "plan",
  "implement",
  "verify",
  "diagnose",
  "report",
] as const;

export type PhaseName = (typeof PHASES)[number];

/** All named phases including ticket bootstrap. */
export const ALL_PHASES = [FROM_TICKET_PHASE, ...PHASES] as const;

export type AnyPhaseName = (typeof ALL_PHASES)[number];

export const DEFAULT_MAX_DIAGNOSE_ITERATIONS = 3;

export function isPhaseName(value: string): value is PhaseName {
  return (PHASES as readonly string[]).includes(value);
}

export function isAnyPhaseName(value: string): value is AnyPhaseName {
  return (ALL_PHASES as readonly string[]).includes(value);
}
