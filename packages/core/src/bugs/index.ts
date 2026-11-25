export {
  parseBugId,
  newLocalBugId,
  evidenceKeyForBug,
  type BugIdKind,
  type ParsedBugId,
} from "./parse.js";

export {
  encodeBugIdForPath,
  resolveBugPaths,
  readBugMeta,
  writeBugMeta,
  listBugIds,
  type BugArtifactName,
  type BugPaths,
  type BugMeta,
} from "./paths.js";

export {
  ensureBugReport,
  ensureBugArtifact,
  loadBugTemplate,
  BUILTIN_REPORT_TEMPLATE_PT,
  BUILTIN_DEBUG_TEMPLATE_PT,
  BUILTIN_QA_TEMPLATE_PT,
  type EnsureBugReportOptions,
  type EnsureBugReportResult,
} from "./report.js";
