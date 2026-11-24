import type { AnyPhaseName, PhaseName } from "./phases.js";

export type PhaseStatus =
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "blocked"
  | "skipped";

export type ScenarioTag = "api" | "ui" | "e2e";

export type StepKeyword = "Dado" | "Quando" | "Então" | "E";

/** Supported ticketing systems for `/sdd from-ticket`. */
export type TicketProviderName = "linear" | "jira";

/** Reference used to fetch a ticket (id as typed by the human). */
export interface TicketRef {
  id: string;
  provider?: TicketProviderName;
}

/** Normalized ticket payload used to draft NL specs. */
export interface TicketPayload {
  id: string;
  url: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  labels: string[];
  provider: TicketProviderName;
}

/** Provenance artifact written to `.sdd/ticket.json`. */
export interface TicketProvenance {
  fetchedAt: string;
  ref: TicketRef;
  ticket: TicketPayload;
  draftSpecPath: string;
}

export interface CanonicalStep {
  keyword: StepKeyword;
  text: string;
}

export interface CanonicalScenario {
  /** Stable id derived from source file + scenario title. */
  id: string;
  title: string;
  intention?: string;
  sourceFile: string;
  tags: ScenarioTag[];
  steps: CanonicalStep[];
}

export interface CanonicalDocument {
  featureTitle: string;
  intention?: string;
  sourceFile: string;
  scenarios: CanonicalScenario[];
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  relatedScenarioIds: string[];
  status: PhaseStatus;
  order: number;
}

export interface PlanDocument {
  generatedAt: string;
  tasks: PlanTask[];
}

export interface PhaseResult {
  phase: PhaseName | AnyPhaseName;
  status: PhaseStatus;
  message?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface RunnerResult {
  name: "cucumber" | "playwright" | "all";
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

export interface RunReport {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: PhaseStatus;
  phases: PhaseResult[];
  diagnoseIterations: number;
  runners?: RunnerResult[];
  notes?: string[];
}
