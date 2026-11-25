/** Canonical folder layout relative to project root. */
export const DEFAULT_PATHS = {
  specs: "specs",
  premises: ".sdd/premises.md",
  canonical: ".sdd/canonical",
  plan: ".sdd/plan",
  runs: ".sdd/runs",
  /**
   * Legacy per-run demo packs (`.sdd/demo/<runId>/`).
   * Prefer stakeholder path under `evidence` (keyed by ticket / stable id).
   */
  demo: ".sdd/demo",
  /**
   * Stakeholder evidence packs keyed by ticket or stable local id:
   * `.sdd/evidence/<evidenceKey>/latest/demo/`.
   */
  evidence: ".sdd/evidence",
  /** Stable local evidence id when no ticket provenance exists. */
  evidenceId: ".sdd/evidence-id.json",
  /** Provenance written by `/sdd from-ticket`. */
  ticket: ".sdd/ticket.json",
  /** Stack detection provenance / optional override (`detectStack`). */
  stack: ".sdd/stack.json",
  features: "tests/features",
  steps: "tests/steps",
  e2e: "tests/e2e",
  src: "src",
  manifest: "sdd.yaml",
} as const;

export type SddPathKey = keyof typeof DEFAULT_PATHS;

/** Join project root with a relative SDD path (POSIX-style for portability). */
export function resolveSddPath(projectRoot: string, relativePath: string): string {
  const root = projectRoot.replace(/\\/g, "/").replace(/\/+$/, "");
  const rel = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${root}/${rel}`;
}

export function defaultPaths(): typeof DEFAULT_PATHS {
  return { ...DEFAULT_PATHS };
}
