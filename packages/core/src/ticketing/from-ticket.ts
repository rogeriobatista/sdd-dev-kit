import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SddManifest, SddTicketing } from "../schema.js";
import { DEFAULT_PATHS, resolveSddPath } from "../paths.js";
import type {
  TicketPayload,
  TicketProvenance,
  TicketProviderName,
  TicketRef,
} from "../types.js";
import { detectProvider, parseTicketRef } from "./detect.js";
import { JiraProvider } from "./jira.js";
import { LinearProvider } from "./linear.js";
import {
  draftSpecFileName,
  mapTicketToSpecMarkdown,
} from "./map-to-spec.js";
import type { FetchLike, TicketProvider } from "./provider.js";

export interface FromTicketOptions {
  /** Absolute project root. */
  projectRoot: string;
  /** Ticket id, optionally prefixed `linear:` / `jira:`. */
  ticketId: string;
  /** Parsed sdd.yaml (ticketing section used for auth env names + default provider). */
  manifest?: SddManifest;
  /** Override provider map (tests). */
  providers?: Partial<Record<TicketProviderName, TicketProvider>>;
  fetchImpl?: FetchLike;
  env?: NodeJS.ProcessEnv;
  /** When true, overwrite an existing draft spec with the same name. */
  overwrite?: boolean;
}

export interface FromTicketResult {
  ref: TicketRef;
  ticket: TicketPayload;
  draftSpecPath: string;
  provenancePath: string;
  markdown: string;
  provenance: TicketProvenance;
}

function buildProviders(
  ticketing: SddTicketing | undefined,
  options: FromTicketOptions,
): Record<TicketProviderName, TicketProvider> {
  const linearConfig = ticketing?.providers?.linear;
  const jiraConfig = ticketing?.providers?.jira;

  return {
    linear:
      options.providers?.linear ??
      new LinearProvider({
        config: linearConfig,
        env: options.env,
        fetchImpl: options.fetchImpl,
      }),
    jira:
      options.providers?.jira ??
      new JiraProvider({
        config: jiraConfig,
        env: options.env,
        fetchImpl: options.fetchImpl,
      }),
  };
}

/**
 * Fetch a ticket, write draft `specs/*.md` + `.sdd/ticket.json` provenance.
 * Does not run the normalize→verify pipeline — caller may chain `/sdd run`.
 */
export async function fromTicket(
  options: FromTicketOptions,
): Promise<FromTicketResult> {
  const ref = parseTicketRef(options.ticketId);
  const ticketing = options.manifest?.ticketing;
  const providerName = detectProvider(ref, ticketing);

  if (ticketing?.providers?.[providerName]?.enabled === false) {
    throw new Error(
      `Provider "${providerName}" is disabled in sdd.yaml ticketing.providers`,
    );
  }

  const providers = buildProviders(ticketing, options);
  const provider = providers[providerName];
  const ticket = await provider.fetch({ ...ref, provider: providerName });

  const markdown = mapTicketToSpecMarkdown(ticket);
  const specsDirRel =
    options.manifest?.paths.specs ?? DEFAULT_PATHS.specs;
  const specsDir = resolveSddPath(options.projectRoot, specsDirRel);
  const fileName = draftSpecFileName(ticket);
  const draftSpecAbs = path.join(specsDir, fileName);
  const draftSpecPath = `${specsDirRel.replace(/\\/g, "/")}/${fileName}`;

  const ticketRel = DEFAULT_PATHS.ticket;
  const provenancePathAbs = resolveSddPath(options.projectRoot, ticketRel);

  await mkdir(specsDir, { recursive: true });
  await mkdir(path.dirname(provenancePathAbs), { recursive: true });

  const provenance: TicketProvenance = {
    fetchedAt: new Date().toISOString(),
    ref: { id: ref.id, provider: providerName },
    ticket,
    draftSpecPath,
  };

  // Avoid clobbering human-edited specs unless overwrite is set
  const { access } = await import("node:fs/promises");
  let exists = false;
  try {
    await access(draftSpecAbs);
    exists = true;
  } catch {
    exists = false;
  }
  if (exists && !options.overwrite) {
    throw new Error(
      `Draft spec already exists at ${draftSpecPath}. Review/edit it, or pass overwrite to regenerate from the ticket.`,
    );
  }

  await writeFile(draftSpecAbs, markdown, "utf8");
  await writeFile(
    provenancePathAbs,
    `${JSON.stringify(provenance, null, 2)}\n`,
    "utf8",
  );

  return {
    ref: { id: ref.id, provider: providerName },
    ticket,
    draftSpecPath,
    provenancePath: ticketRel,
    markdown,
    provenance,
  };
}
