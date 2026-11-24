import type { SddTicketing } from "../schema.js";
import type { TicketProviderName, TicketRef } from "../types.js";

/** Linear issue UUID (GraphQL id). */
const LINEAR_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Issue key like ENG-123 or PROJ-42 (Linear identifier or Jira key). */
const ISSUE_KEY_RE = /^([A-Za-z][A-Za-z0-9]+)-(\d+)$/;

export type DetectedTicketId =
  | { kind: "uuid"; value: string }
  | { kind: "issue-key"; project: string; number: string; value: string };

export function parseTicketId(raw: string): DetectedTicketId {
  const id = raw.trim();
  if (!id) {
    throw new Error("Ticket id is empty");
  }
  if (LINEAR_UUID_RE.test(id)) {
    return { kind: "uuid", value: id };
  }
  const key = ISSUE_KEY_RE.exec(id);
  if (key) {
    return {
      kind: "issue-key",
      project: key[1]!.toUpperCase(),
      number: key[2]!,
      value: `${key[1]!.toUpperCase()}-${key[2]!}`,
    };
  }
  throw new Error(
    `Unrecognized ticket id "${raw}". Expected Linear UUID, Linear identifier (TEAM-123), or Jira key (PROJ-123).`,
  );
}

/**
 * Resolve which provider to use.
 * - Explicit `ref.provider` wins
 * - UUID → Linear
 * - Ambiguous KEY-123 → `ticketing.defaultProvider`, else error
 */
export function detectProvider(
  ref: TicketRef,
  ticketing?: SddTicketing,
): TicketProviderName {
  if (ref.provider) {
    return ref.provider;
  }

  const parsed = parseTicketId(ref.id);
  if (parsed.kind === "uuid") {
    return "linear";
  }

  if (ticketing?.defaultProvider) {
    return ticketing.defaultProvider;
  }

  throw new Error(
    `Ambiguous ticket id "${ref.id}" (matches both Linear identifiers and Jira keys). ` +
      `Set ticketing.defaultProvider in sdd.yaml, or pass provider explicitly ` +
      `(e.g. /sdd from-ticket linear:${ref.id} or /sdd from-ticket jira:${ref.id}).`,
  );
}

/** Parse `linear:ENG-123`, `jira:PROJ-1`, or bare id into a TicketRef. */
export function parseTicketRef(raw: string): TicketRef {
  const trimmed = raw.trim();
  const prefixed = /^(linear|jira)\s*:\s*(.+)$/i.exec(trimmed);
  if (prefixed) {
    return {
      id: prefixed[2]!.trim(),
      provider: prefixed[1]!.toLowerCase() as TicketProviderName,
    };
  }
  return { id: trimmed };
}
