import type { TicketPayload } from "../types.js";

export interface MapTicketToSpecOptions {
  /** Optional extra note appended under Intenção. */
  notes?: string;
}

function slugifyTitle(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "ticket";
}

/** Suggested specs/*.md filename for a ticket draft. */
export function draftSpecFileName(ticket: TicketPayload): string {
  return `${ticket.id.toLowerCase()}-${slugifyTitle(ticket.title)}.md`;
}

const GWT_LINE_RE = /^(Dado|Quando|Então|E)\s+/i;

function looksLikeGwtBlock(text: string): boolean {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.some((l) => GWT_LINE_RE.test(l));
}

function normalizeGwtLine(line: string): string {
  const trimmed = line.trim();
  const match = /^(Dado|Quando|Então|E)\s+(.+)$/i.exec(trimmed);
  if (!match) {
    return trimmed;
  }
  // Preserve Portuguese Então accent even if input used "Entao"
  const kw = /então|entao/i.test(match[1]!)
    ? "Então"
    : /dado/i.test(match[1]!)
      ? "Dado"
      : /quando/i.test(match[1]!)
        ? "Quando"
        : "E";
  return `${kw} ${match[2]!.trim()}`;
}

function scenarioFromAcItem(item: string, index: number): string {
  const body = item.trim();
  if (looksLikeGwtBlock(body)) {
    const lines = body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map(normalizeGwtLine);
    const title =
      lines.find((l) => l.startsWith("Quando "))?.replace(/^Quando\s+/i, "") ??
      `Critério ${index + 1}`;
    return [
      `### ${capitalize(title)} @api`,
      ...lines,
      "",
    ].join("\n");
  }

  return [
    `### Critério ${index + 1} — completar cenários @api`,
    `Dado o contexto descrito no ticket`,
    `Quando a ação relacionada a: ${body}`,
    `Então o resultado esperado é: ${body}`,
    ``,
    `<!-- TODO: enriquecer este cenário com Dado/Quando/Então concretos; não inventar AC ausentes no ticket -->`,
    "",
  ].join("\n");
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Template-based Portuguese NL draft (prosa + Dado/Quando/Então).
 * Does **not** invent acceptance criteria — only maps what the ticket provides.
 * LLM enrichment (if any) happens in the Cursor skill after human review.
 */
export function mapTicketToSpecMarkdown(
  ticket: TicketPayload,
  options: MapTicketToSpecOptions = {},
): string {
  const labels =
    ticket.labels.length > 0
      ? ticket.labels.map((l) => `\`${l}\``).join(", ")
      : "_(nenhuma)_";

  const acSection =
    ticket.acceptanceCriteria.length > 0
      ? ticket.acceptanceCriteria.map((c) => `- ${c}`).join("\n")
      : "- _(ticket sem critérios de aceite explícitos — enriquecer `## Cenários` antes de `/sdd run`)_";

  const scenarios =
    ticket.acceptanceCriteria.length > 0
      ? ticket.acceptanceCriteria
          .map((item, i) => scenarioFromAcItem(item, i))
          .join("\n")
      : [
          `### Cenário a definir @api`,
          `Dado o contexto do ticket "${ticket.title}"`,
          `Quando a funcionalidade for exercitada`,
          `Então o comportamento deve seguir a intenção acima`,
          ``,
          `<!-- TODO: o ticket não trouxe cenários testáveis; peça ao humano para enriquecer specs/ -->`,
          "",
        ].join("\n");

  const intentionParts = [
    ticket.description.trim() ||
      "_(sem descrição no ticket — completar intenção com o humano)_",
  ];
  if (options.notes) {
    intentionParts.push(options.notes.trim());
  }

  return [
    `# ${ticket.title}`,
    ``,
    `> Provenance: ${ticket.provider} \`${ticket.id}\` — ${ticket.url}`,
    `> Labels: ${labels}`,
    ``,
    `## Intenção`,
    intentionParts.join("\n\n"),
    ``,
    `## Critérios de aceite (do ticket)`,
    acSection,
    ``,
    `## Cenários`,
    ``,
    scenarios.trimEnd(),
    ``,
  ].join("\n");
}

/**
 * Extract acceptance-criteria bullet/numbered lines from free-form description
 * when the provider did not supply a dedicated AC field.
 */
export function extractAcceptanceCriteriaFromText(text: string): string[] {
  if (!text.trim()) return [];

  const lines = text.split(/\r?\n/);
  const collected: string[] = [];
  let inAcSection = false;
  let buffer: string[] = [];

  const flushBuffer = () => {
    const joined = buffer.join("\n").trim();
    if (joined) collected.push(joined);
    buffer = [];
  };

  for (const line of lines) {
    const heading = /^\s{0,3}#{1,3}\s*(acceptance criteria|critérios de aceite|criterios de aceite|ac)\b/i.exec(
      line,
    );
    if (heading) {
      inAcSection = true;
      continue;
    }
    if (inAcSection && /^\s{0,3}#{1,3}\s+\S/.test(line)) {
      flushBuffer();
      inAcSection = false;
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.+)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (inAcSection && (bullet || numbered)) {
      flushBuffer();
      buffer.push((bullet?.[1] ?? numbered?.[1] ?? "").trim());
      continue;
    }
    if (inAcSection && buffer.length > 0 && line.trim()) {
      buffer.push(line.trim());
      continue;
    }
    if (inAcSection && !line.trim()) {
      flushBuffer();
    }
  }
  flushBuffer();

  if (collected.length > 0) return collected;

  // Fallback: top-level bullets anywhere in the body
  for (const line of lines) {
    const bullet = /^\s*[-*+]\s+(.+)$/.exec(line);
    if (bullet) collected.push(bullet[1]!.trim());
  }
  return collected;
}
