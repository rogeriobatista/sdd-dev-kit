/** Canonical folder layout relative to project root. */
export const DEFAULT_PATHS = {
  specs: "specs",
  premises: ".sdd/premises.md",
  canonical: ".sdd/canonical",
  /** Legacy task-plan directory; prefer `implementationPlan` for step 4. */
  plan: ".sdd/plan",
  /** Step 3 — Dev Spec document. */
  devSpec: ".sdd/dev-spec.md",
  /** Step 4 — Dev Implementation Plan document. */
  implementationPlan: ".sdd/implementation-plan.md",
  /** Step 5 — Design & Approach definitions. */
  designApproach: ".sdd/design-approach.md",
  /** Best-practices research packs keyed like evidence: `.sdd/research/<key>/`. */
  research: ".sdd/research",
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
  /**
   * Step 2 — executable Spec Tests (Cucumber features by default).
   * Stacks may use `tests/spec/` via sdd.yaml; keep `features` name stable in schema.
   */
  features: "tests/features",
  /** Alternate Spec Tests root when a stack prefers `tests/spec/`. */
  spec: "tests/spec",
  steps: "tests/steps",
  /** Step 6 — unit tests. */
  unit: "tests/unit",
  /** Step 7 — integration tests. */
  integration: "tests/integration",
  /** Step 8 — e2e tests (Playwright etc.). */
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
