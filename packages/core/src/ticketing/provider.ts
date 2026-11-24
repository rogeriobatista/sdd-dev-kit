import type { TicketPayload, TicketRef } from "../types.js";

/** Pluggable ticket source (Linear, Jira, …). */
export interface TicketProvider {
  readonly name: TicketPayload["provider"];
  fetch(ref: TicketRef): Promise<TicketPayload>;
}

/** Injectable HTTP client for tests (defaults to global fetch). */
export type FetchLike = typeof fetch;

export interface HttpClientOptions {
  fetchImpl?: FetchLike;
}

export function resolveFetch(options?: HttpClientOptions): FetchLike {
  const impl = options?.fetchImpl ?? globalThis.fetch;
  if (typeof impl !== "function") {
    throw new Error(
      "fetch is not available; pass fetchImpl or use Node.js 20+",
    );
  }
  return impl;
}

/** Read a required secret from env by configured variable name. */
export function requireEnv(
  envName: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const value = env[envName]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${envName}. Set it in the environment — never pass secrets on the command line.`,
    );
  }
  return value;
}

export function optionalEnv(
  envName: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const value = env[envName]?.trim();
  return value || undefined;
}
