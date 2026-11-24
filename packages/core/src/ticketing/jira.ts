import type { SddJiraProviderConfig } from "../schema.js";
import type { TicketPayload, TicketRef } from "../types.js";
import { extractAcceptanceCriteriaFromText } from "./map-to-spec.js";
import {
  type HttpClientOptions,
  type TicketProvider,
  optionalEnv,
  requireEnv,
  resolveFetch,
} from "./provider.js";

interface JiraIssueResponse {
  key: string;
  self?: string;
  fields?: {
    summary?: string;
    description?: unknown;
    labels?: string[];
    [key: string]: unknown;
  };
}

export interface JiraProviderOptions extends HttpClientOptions {
  config?: SddJiraProviderConfig;
  env?: NodeJS.ProcessEnv;
}

/**
 * Jira Cloud / Server REST provider.
 *
 * Auth (env var names configurable in sdd.yaml):
 * - JIRA_BASE_URL (required) — e.g. https://your-domain.atlassian.net
 * - JIRA_API_TOKEN (required)
 * - JIRA_EMAIL (required for Cloud basic auth; optional if token is a PAT that
 *   the server accepts as Bearer — when email is absent we send Bearer)
 */
export class JiraProvider implements TicketProvider {
  readonly name = "jira" as const;
  private readonly config: SddJiraProviderConfig;
  private readonly env: NodeJS.ProcessEnv;
  private readonly fetchImpl: typeof fetch;

  constructor(options: JiraProviderOptions = {}) {
    this.config = options.config ?? {
      enabled: true,
      baseUrlEnv: "JIRA_BASE_URL",
      emailEnv: "JIRA_EMAIL",
      apiTokenEnv: "JIRA_API_TOKEN",
    };
    this.env = options.env ?? process.env;
    this.fetchImpl = resolveFetch(options);
  }

  async fetch(ref: TicketRef): Promise<TicketPayload> {
    const baseUrl = requireEnv(this.config.baseUrlEnv, this.env).replace(
      /\/+$/,
      "",
    );
    const token = requireEnv(this.config.apiTokenEnv, this.env);
    const email = optionalEnv(this.config.emailEnv, this.env);

    const key = ref.id.trim().toUpperCase();
    const fields = [
      "summary",
      "description",
      "labels",
      this.config.fieldMapping?.acceptanceCriteria,
    ]
      .filter(Boolean)
      .join(",");

    const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(key)}?fields=${encodeURIComponent(fields)}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (email) {
      const basic = Buffer.from(`${email}:${token}`).toString("base64");
      headers.Authorization = `Basic ${basic}`;
    } else {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await this.fetchImpl(url, { method: "GET", headers });
    if (response.status === 404) {
      throw new Error(`Jira issue not found: ${key}`);
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Jira API HTTP ${response.status}: ${body.slice(0, 200)}`,
      );
    }

    const issue = (await response.json()) as JiraIssueResponse;
    const descriptionText = adfOrStringToText(issue.fields?.description);
    const acFieldId = this.config.fieldMapping?.acceptanceCriteria;
    let acceptanceCriteria: string[] = [];

    if (acFieldId && issue.fields && acFieldId in issue.fields) {
      acceptanceCriteria = extractAcceptanceCriteriaFromText(
        adfOrStringToText(issue.fields[acFieldId]),
      );
      if (acceptanceCriteria.length === 0) {
        const raw = adfOrStringToText(issue.fields[acFieldId]).trim();
        if (raw) acceptanceCriteria = [raw];
      }
    } else {
      acceptanceCriteria = extractAcceptanceCriteriaFromText(descriptionText);
    }

    const browseUrl = `${baseUrl}/browse/${issue.key}`;

    return {
      id: issue.key,
      url: browseUrl,
      title: issue.fields?.summary ?? issue.key,
      description: descriptionText,
      acceptanceCriteria,
      labels: issue.fields?.labels ?? [],
      provider: "jira",
    };
  }
}

/** Flatten Atlassian Document Format (ADF) or plain string to text. */
export function adfOrStringToText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);

  const node = value as {
    type?: string;
    text?: string;
    content?: unknown[];
  };

  if (typeof node.text === "string") return node.text;

  if (Array.isArray(node.content)) {
    const parts = node.content.map((child) => adfOrStringToText(child));
    if (node.type === "paragraph" || node.type === "heading") {
      return parts.join("") + "\n";
    }
    if (node.type === "listItem") {
      return `- ${parts.join("").trim()}\n`;
    }
    if (node.type === "bulletList" || node.type === "orderedList") {
      return parts.join("");
    }
    return parts.join("");
  }

  return "";
}
