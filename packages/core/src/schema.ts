import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { DEFAULT_PATHS } from "./paths.js";
import { DEFAULT_MAX_DIAGNOSE_ITERATIONS } from "./phases.js";

export const SddPathsSchema = z.object({
  specs: z.string().min(1).default(DEFAULT_PATHS.specs),
  premises: z.string().min(1).default(DEFAULT_PATHS.premises),
  canonical: z.string().min(1).default(DEFAULT_PATHS.canonical),
  plan: z.string().min(1).default(DEFAULT_PATHS.plan),
  runs: z.string().min(1).default(DEFAULT_PATHS.runs),
  features: z.string().min(1).default(DEFAULT_PATHS.features),
  steps: z.string().min(1).default(DEFAULT_PATHS.steps),
  e2e: z.string().min(1).default(DEFAULT_PATHS.e2e),
  src: z.string().min(1).default(DEFAULT_PATHS.src),
});

export const SddRunnersSchema = z.object({
  cucumber: z
    .string()
    .min(1)
    .default("npm run sdd:verify:cucumber"),
  playwright: z
    .string()
    .min(1)
    .default("npm run sdd:verify:playwright"),
  all: z.string().min(1).default("npm run sdd:verify:all"),
});

export const SddTriggersSchema = z.object({
  /** Watch is in the contract but OFF for MVP. */
  watch: z.boolean().default(false),
  command: z.string().min(1).default("/sdd run"),
});

export const SddLoopSchema = z.object({
  maxDiagnoseIterations: z
    .number()
    .int()
    .positive()
    .max(10)
    .default(DEFAULT_MAX_DIAGNOSE_ITERATIONS),
});

/** Field-mapping hints only — never secret values. */
export const SddTicketingFieldMappingSchema = z.object({
  /** Jira custom field id or Linear description section hint for AC. */
  acceptanceCriteria: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  labels: z.string().min(1).optional(),
});

export const SddLinearProviderSchema = z.object({
  enabled: z.boolean().default(true),
  /** Env var name holding the Linear API key (default LINEAR_API_KEY). */
  apiKeyEnv: z.string().min(1).default("LINEAR_API_KEY"),
  /** Optional default team key used when resolving short ids. */
  defaultTeam: z.string().min(1).optional(),
  fieldMapping: SddTicketingFieldMappingSchema.optional(),
});

export const SddJiraProviderSchema = z.object({
  enabled: z.boolean().default(true),
  /** Env var name for Jira Cloud/Server base URL (default JIRA_BASE_URL). */
  baseUrlEnv: z.string().min(1).default("JIRA_BASE_URL"),
  /** Env var name for Atlassian account email (default JIRA_EMAIL). */
  emailEnv: z.string().min(1).default("JIRA_EMAIL"),
  /** Env var name for API token (default JIRA_API_TOKEN). */
  apiTokenEnv: z.string().min(1).default("JIRA_API_TOKEN"),
  /** Optional default project key (e.g. PROJ). */
  defaultProject: z.string().min(1).optional(),
  fieldMapping: SddTicketingFieldMappingSchema.optional(),
});

export const SddTicketingSchema = z.object({
  /** Used when the ticket id format is ambiguous (e.g. ENG-123). */
  defaultProvider: z.enum(["linear", "jira"]).optional(),
  providers: z
    .object({
      linear: SddLinearProviderSchema.optional(),
      jira: SddJiraProviderSchema.optional(),
    })
    .default({}),
});

export const SddManifestSchema = z.object({
  version: z.union([z.string(), z.number()]).transform(String).default("1"),
  adapter: z.enum(["typescript"]).default("typescript"),
  paths: SddPathsSchema.default(() => SddPathsSchema.parse({})),
  runners: SddRunnersSchema.default(() => SddRunnersSchema.parse({})),
  triggers: SddTriggersSchema.default(() => SddTriggersSchema.parse({})),
  loop: SddLoopSchema.default(() => SddLoopSchema.parse({})),
  /** Optional ticket → specs bootstrap (Linear + Jira). */
  ticketing: SddTicketingSchema.optional(),
});

export type SddManifest = z.infer<typeof SddManifestSchema>;
export type SddPaths = z.infer<typeof SddPathsSchema>;
export type SddRunners = z.infer<typeof SddRunnersSchema>;
export type SddTriggers = z.infer<typeof SddTriggersSchema>;
export type SddLoop = z.infer<typeof SddLoopSchema>;
export type SddTicketing = z.infer<typeof SddTicketingSchema>;
export type SddLinearProviderConfig = z.infer<typeof SddLinearProviderSchema>;
export type SddJiraProviderConfig = z.infer<typeof SddJiraProviderSchema>;
export type SddTicketingFieldMapping = z.infer<
  typeof SddTicketingFieldMappingSchema
>;

export function createDefaultManifest(): SddManifest {
  return SddManifestSchema.parse({});
}

export function parseSddManifest(input: unknown): SddManifest {
  return SddManifestSchema.parse(input);
}

export function parseSddYaml(yamlText: string): SddManifest {
  const raw = parseYaml(yamlText);
  if (raw === null || raw === undefined) {
    return createDefaultManifest();
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("sdd.yaml must be a YAML mapping/object");
  }
  return parseSddManifest(raw);
}

export function safeParseSddYaml(yamlText: string):
  | { success: true; data: SddManifest }
  | { success: false; error: z.ZodError | Error } {
  try {
    return { success: true, data: parseSddYaml(yamlText) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
