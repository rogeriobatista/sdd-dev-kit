export {
  DEFAULT_PATHS,
  defaultPaths,
  resolveSddPath,
  type SddPathKey,
} from "./paths.js";

export {
  PHASES,
  ALL_PHASES,
  FROM_TICKET_PHASE,
  DEFAULT_MAX_DIAGNOSE_ITERATIONS,
  isPhaseName,
  isAnyPhaseName,
  type PhaseName,
  type AnyPhaseName,
} from "./phases.js";

export type {
  PhaseStatus,
  ScenarioTag,
  StepKeyword,
  CanonicalStep,
  CanonicalScenario,
  CanonicalDocument,
  PlanTask,
  PlanDocument,
  PhaseResult,
  RunnerResult,
  RunReport,
  TicketProviderName,
  TicketRef,
  TicketPayload,
  TicketProvenance,
} from "./types.js";

export {
  STACK_ADAPTER_IDS,
  SddManifestSchema,
  SddPathsSchema,
  SddRunnersSchema,
  SddTriggersSchema,
  SddLoopSchema,
  SddTicketingSchema,
  SddLinearProviderSchema,
  SddJiraProviderSchema,
  SddTicketingFieldMappingSchema,
  SddStackAdapterIdSchema,
  SddHostAdapterIdSchema,
  SddAdaptersBlockSchema,
  createDefaultManifest,
  parseSddManifest,
  parseSddYaml,
  safeParseSddYaml,
  type StackAdapterId,
  type StackAdapterIdInput,
  type SddManifest,
  type SddPaths,
  type SddRunners,
  type SddTriggers,
  type SddLoop,
  type SddTicketing,
  type SddLinearProviderConfig,
  type SddJiraProviderConfig,
  type SddTicketingFieldMapping,
  type SddAdaptersBlock,
  type SddHostAdapterId,
} from "./schema.js";

export {
  fromTicket,
  parseTicketId,
  parseTicketRef,
  detectProvider,
  mapTicketToSpecMarkdown,
  draftSpecFileName,
  extractAcceptanceCriteriaFromText,
  LinearProvider,
  JiraProvider,
  adfOrStringToText,
  requireEnv,
  optionalEnv,
  resolveFetch,
  type TicketProvider,
  type FetchLike,
  type FromTicketOptions,
  type FromTicketResult,
} from "./ticketing/index.js";

export { runShellCommand, type ShellResult } from "./shell.js";

export {
  usesCucumber,
  usesPlaywright,
  formatGherkinTags,
  slugifyScenarioBase,
} from "./tags.js";
