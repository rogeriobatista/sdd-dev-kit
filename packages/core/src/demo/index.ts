export { buildDemo, listRunIds, resolveRunId } from "./build-demo.js";
export { collectEvidence, copyEvidenceIntoDemo, EVIDENCE_CANDIDATES } from "./evidence.js";
export { scrubSecrets } from "./secrets.js";
export {
  applyResultsToFeatures,
  loadDemoFeatures,
  loadRunReport,
  parseCucumberJson,
  parseJunitXml,
  parsePlaywrightJson,
  parseSpecMarkdown,
} from "./scenarios.js";
export {
  buildManifest,
  renderIndexHtml,
  renderSummaryMarkdown,
} from "./render.js";
export type {
  BuildDemoOptions,
  BuildDemoResult,
  DemoFeature,
  DemoManifest,
  DemoScenario,
  DemoScenarioStep,
  EvidenceFile,
  EvidenceKind,
  ScenarioDemoStatus,
} from "./types.js";
