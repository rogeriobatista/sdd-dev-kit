import crypto from "node:crypto";
import { parseTicketRef } from "../ticketing/detect.js";
import type { TicketProviderName } from "../types.js";

/** Logical bug id: ticket form (`linear:ENG-42`) or stable local (`bug_<uuid>`). */
export type BugIdKind = "ticket" | "local";

export type ParsedBugId = {
  /** Logical id used in meta / evidence alignment. */
  bugId: string;
  kind: BugIdKind;
  /** When kind=ticket, provider + bare issue id. */
  ticket?: {
    provider: TicketProviderName;
    id: string;
  };
};

const LOCAL_BUG_RE = /^bug_[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ISSUE_KEY_RE = /^([A-Za-z][A-Za-z0-9]+)-(\d+)$/;
const LINEAR_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Parse a bug id from CLI / host intent.
 * - Prefixed ticket: `linear:ENG-42` / `jira:SHOP-7`
 * - Existing local: `bug_<uuid>`
 * - Bare issue key / Linear UUID with optional defaultProvider → ticket form
 * - Empty / omitted → generate `bug_<uuid>`
 */
export function parseBugId(
  raw?: string | null,
  options?: { defaultProvider?: TicketProviderName },
): ParsedBugId {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { bugId: newLocalBugId(), kind: "local" };
  }

  if (LOCAL_BUG_RE.test(trimmed)) {
    return { bugId: trimmed.toLowerCase(), kind: "local" };
  }

  const prefixed = /^(linear|jira)\s*:\s*(.+)$/i.exec(trimmed);
  if (prefixed) {
    const provider = prefixed[1]!.toLowerCase() as TicketProviderName;
    const id = normalizeTicketBareId(prefixed[2]!.trim());
    return {
      bugId: `${provider}:${id}`,
      kind: "ticket",
      ticket: { provider, id },
    };
  }

  if (LINEAR_UUID_RE.test(trimmed)) {
    return {
      bugId: `linear:${trimmed.toLowerCase()}`,
      kind: "ticket",
      ticket: { provider: "linear", id: trimmed.toLowerCase() },
    };
  }

  if (ISSUE_KEY_RE.test(trimmed)) {
    const ref = parseTicketRef(trimmed);
    const bare = normalizeTicketBareId(ref.id);
    const provider = options?.defaultProvider;
    if (!provider) {
      throw new Error(
        `Ambiguous bug/ticket id "${trimmed}". Pass linear:${bare} or jira:${bare}, ` +
          `or set ticketing.defaultProvider in sdd.yaml.`,
      );
    }
    return {
      bugId: `${provider}:${bare}`,
      kind: "ticket",
      ticket: { provider, id: bare },
    };
  }

  throw new Error(
    `Unrecognized bug id "${raw}". Expected linear:KEY-n, jira:KEY-n, bug_<uuid>, or omit to generate.`,
  );
}

/** Generate a stable local bug id (`bug_<uuid>`). */
export function newLocalBugId(): string {
  return `bug_${crypto.randomUUID()}`;
}

function normalizeTicketBareId(id: string): string {
  const trimmed = id.trim();
  if (LINEAR_UUID_RE.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  const key = ISSUE_KEY_RE.exec(trimmed);
  if (key) {
    return `${key[1]!.toUpperCase()}-${key[2]!}`;
  }
  return trimmed;
}

/**
 * Evidence key aligned with the bug when ticket-linked; else the local bug id.
 * Matches existing evidence system ticket form (`linear:ENG-42`).
 */
export function evidenceKeyForBug(parsed: ParsedBugId): string {
  return parsed.bugId;
}
