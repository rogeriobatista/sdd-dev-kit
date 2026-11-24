import type { PhaseStatus, StepKeyword } from "../types.js";

/** Known evidence kinds collected from stack adapters. */
export type EvidenceKind =
  | "run-report"
  | "cucumber-json"
  | "cucumber-html"
  | "playwright-html"
  | "playwright-json"
  | "playwright-trace"
  | "screenshot"
  | "video"
  | "pytest-junit"
  | "pytest-html"
  | "vitest-json"
  | "terraform-log"
  | "other";

export type ScenarioDemoStatus = "passed" | "failed" | "skipped" | "unknown";

export interface EvidenceFile {
  kind: EvidenceKind;
  /** Absolute path on disk when collected. */
  absolutePath: string;
  /** Path relative to project root (POSIX). */
  relativePath: string;
  /** Path relative to the demo pack (after optional copy). */
  demoRelativePath?: string;
  label: string;
}

export interface DemoScenarioStep {
  keyword: StepKeyword | string;
  text: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  intention?: string;
  sourceFile?: string;
  tags: string[];
  steps: DemoScenarioStep[];
  status: ScenarioDemoStatus;
  /** Short business-facing note (failure reason scrubbed of secrets). */
  detail?: string;
  evidence: EvidenceFile[];
}

export interface DemoFeature {
  title: string;
  intention?: string;
  sourceFile?: string;
  scenarios: DemoScenario[];
}

export interface BuildDemoOptions {
  projectRoot: string;
  /** Specific run id under `.sdd/runs/<id>/`. Defaults to latest. */
  runId?: string;
  /**
   * Copy (or hardlink when possible) evidence into `.sdd/demo/<runId>/evidence/`.
   * Default: true — keeps the pack portable / offline-friendly.
   */
  copyEvidence?: boolean;
  /** Stakeholder copy locale. Default: `pt-BR`. */
  locale?: "pt-BR" | "en";
}

export interface DemoManifest {
  version: 1;
  generatedAt: string;
  runId: string;
  projectRoot: string;
  locale: "pt-BR" | "en";
  overallStatus: PhaseStatus | "unknown";
  features: Array<{
    title: string;
    intention?: string;
    sourceFile?: string;
    scenarios: Array<{
      id: string;
      title: string;
      status: ScenarioDemoStatus;
      tags: string[];
      evidence: Array<{
        kind: EvidenceKind;
        path: string;
        label: string;
      }>;
    }>;
  }>;
  evidence: Array<{
    kind: EvidenceKind;
    path: string;
    label: string;
    sourceRelativePath: string;
  }>;
  missingEvidence: string[];
  notes: string[];
}

export interface BuildDemoResult {
  runId: string;
  demoDir: string;
  indexHtmlPath: string;
  summaryMdPath: string;
  manifestPath: string;
  manifest: DemoManifest;
  missingEvidence: string[];
}
