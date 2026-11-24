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

/**
 * Verify commands. `all` is required; cucumber/playwright keep TS defaults.
 * Stack adapters may set pytest / vitest / terraform / fmt / validate or any
 * extra string key via catchall.
 */
export const SddRunnersSchema = z
  .object({
    all: z.string().min(1).default("npm run sdd:verify:all"),
    cucumber: z
      .string()
      .min(1)
      .default("npm run sdd:verify:cucumber"),
    playwright: z
      .string()
      .min(1)
      .default("npm run sdd:verify:playwright"),
    pytest: z.string().min(1).optional(),
    vitest: z.string().min(1).optional(),
    terraform: z.string().min(1).optional(),
    fmt: z.string().min(1).optional(),
    validate: z.string().min(1).optional(),
  })
  .catchall(z.string().min(1));

/** First-class stack adapter ids (portable core; runners live in packages/). */
export const STACK_ADAPTER_IDS = [
  "typescript",
  "ts",
  "python",
  "react-vite",
  "node-graphql",
  "terraform",
] as const;

export type StackAdapterIdInput = (typeof STACK_ADAPTER_IDS)[number];
/** Canonical id after normalizing `ts` → `typescript`. */
export type StackAdapterId =
  | "typescript"
  | "python"
  | "react-vite"
  | "node-graphql"
  | "terraform";

export const SddStackAdapterIdSchema = z
  .enum(STACK_ADAPTER_IDS)
  .transform((value): StackAdapterId =>
    value === "ts" ? "typescript" : value,
  );

export const SddHostAdapterIdSchema = z.enum([
  "cursor",
  "claude",
  "copilot",
]);

/**
 * Optional nested form:
 * `adapters: { stack: python, hosts: [cursor] }`
 * When present, `adapters.stack` wins over top-level `adapter`.
 */
export const SddAdaptersBlockSchema = z.object({
  stack: SddStackAdapterIdSchema.optional(),
  hosts: z.array(SddHostAdapterIdSchema).optional(),
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

const SddManifestObjectSchema = z.object({
  version: z.union([z.string(), z.number()]).transform(String).default("1"),
  /** Stack adapter id. Alias `ts` normalizes to `typescript`. */
  adapter: SddStackAdapterIdSchema.default("typescript"),
  /**
   * Optional nested adapters block. When `adapters.stack` is set, it overrides
   * top-level `adapter` (backward compatible when omitted).
   */
  adapters: SddAdaptersBlockSchema.optional(),
  paths: SddPathsSchema.default(() => SddPathsSchema.parse({})),
  runners: SddRunnersSchema.default(() => SddRunnersSchema.parse({})),
  triggers: SddTriggersSchema.default(() => SddTriggersSchema.parse({})),
  loop: SddLoopSchema.default(() => SddLoopSchema.parse({})),
  /** Optional ticket → specs bootstrap (Linear + Jira). */
  ticketing: SddTicketingSchema.optional(),
});

export const SddManifestSchema = SddManifestObjectSchema.transform((data) => {
  const stack = data.adapters?.stack ?? data.adapter;
  return { ...data, adapter: stack };
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
export type SddAdaptersBlock = z.infer<typeof SddAdaptersBlockSchema>;
export type SddHostAdapterId = z.infer<typeof SddHostAdapterIdSchema>;

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
