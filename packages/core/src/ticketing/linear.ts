import type { SddLinearProviderConfig } from "../schema.js";
import type { TicketPayload, TicketRef } from "../types.js";
import { extractAcceptanceCriteriaFromText } from "./map-to-spec.js";
import {
  type HttpClientOptions,
  type TicketProvider,
  requireEnv,
  resolveFetch,
} from "./provider.js";

const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";

const ISSUE_BY_ID = `
query IssueById($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    description
    url
    labels { nodes { name } }
  }
}
`;

const ISSUE_BY_IDENTIFIER = `
query IssueByIdentifier($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    description
    url
    labels { nodes { name } }
  }
}
`;

interface LinearIssueNode {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  url: string;
  labels?: { nodes?: Array<{ name: string }> };
}

export interface LinearProviderOptions extends HttpClientOptions {
  config?: SddLinearProviderConfig;
  env?: NodeJS.ProcessEnv;
  /** Override GraphQL endpoint (tests). */
  endpoint?: string;
}

export class LinearProvider implements TicketProvider {
  readonly name = "linear" as const;
  private readonly config: SddLinearProviderConfig;
  private readonly env: NodeJS.ProcessEnv;
  private readonly fetchImpl: typeof fetch;
  private readonly endpoint: string;

  constructor(options: LinearProviderOptions = {}) {
    this.config = options.config ?? {
      enabled: true,
      apiKeyEnv: "LINEAR_API_KEY",
    };
    this.env = options.env ?? process.env;
    this.fetchImpl = resolveFetch(options);
    this.endpoint = options.endpoint ?? LINEAR_GRAPHQL_URL;
  }

  async fetch(ref: TicketRef): Promise<TicketPayload> {
    const apiKey = requireEnv(this.config.apiKeyEnv, this.env);
    const issue = await this.queryIssue(ref.id.trim(), apiKey);
    if (!issue) {
      throw new Error(`Linear issue not found: ${ref.id}`);
    }

    const description = issue.description ?? "";
    // Linear stores AC in the description body; fieldMapping.acceptanceCriteria
    // is reserved as a future hint for custom templates / sections.
    void this.config.fieldMapping;
    const acceptanceCriteria = extractAcceptanceCriteriaFromText(description);

    return {
      id: issue.identifier || issue.id,
      url: issue.url,
      title: issue.title,
      description,
      acceptanceCriteria,
      labels: (issue.labels?.nodes ?? []).map((n) => n.name),
      provider: "linear",
    };
  }

  private async queryIssue(
    id: string,
    apiKey: string,
  ): Promise<LinearIssueNode | null> {
    // Linear accepts both UUID and identifier (TEAM-123) via issue(id: …).
    const query = id.includes("-") && /^[A-Za-z]/.test(id)
      ? ISSUE_BY_IDENTIFIER
      : ISSUE_BY_ID;

    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query, variables: { id } }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Linear API HTTP ${response.status}: ${body.slice(0, 200)}`,
      );
    }

    const json = (await response.json()) as {
      data?: { issue?: LinearIssueNode | null };
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      throw new Error(
        `Linear API error: ${json.errors.map((e) => e.message).join("; ")}`,
      );
    }

    return json.data?.issue ?? null;
  }
}
