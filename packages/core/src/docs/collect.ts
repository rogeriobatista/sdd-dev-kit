import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PATHS } from "../paths.js";
import { scrubSecrets } from "../demo/secrets.js";
import { encodeEvidenceKeyForPath } from "../demo/evidence-pack.js";
import { missingMarker } from "./templates.js";

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

export function readTextIfExists(filePath: string, maxLen = 50_000): string | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const st = fs.statSync(filePath);
    if (!st.isFile()) return null;
    return scrubSecrets(fs.readFileSync(filePath, "utf8"), maxLen);
  } catch {
    return null;
  }
}

export function listMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out.sort();
}

export type SpecExcerpt = {
  file: string;
  intention: string | null;
  scenarios: string | null;
  body: string;
};

/** Extract ## Intenção / ## Cenários sections when present; never invent. */
export function parseSpecSections(md: string): {
  intention: string | null;
  scenarios: string | null;
} {
  const intention = extractSection(md, /intenção|intention|resumo|summary/i);
  const scenarios = extractSection(md, /cenários|cenarios|scenarios/i);
  return { intention, scenarios };
}

function extractSection(md: string, headingRe: RegExp): string | null {
  const lines = md.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,3})\s+(.+)$/.exec(lines[i]!);
    if (m && headingRe.test(m[2]!)) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;
  const chunk: string[] = [];
  for (let i = start; i < lines.length; i++) {
    if (/^#{1,3}\s+/.test(lines[i]!)) break;
    chunk.push(lines[i]!);
  }
  const text = chunk.join("\n").trim();
  return text.length > 0 ? text : null;
}

export function collectSpecs(projectRoot: string): SpecExcerpt[] {
  const specsDir = path.join(projectRoot, DEFAULT_PATHS.specs);
  return listMarkdownFiles(specsDir).map((file) => {
    const body = readTextIfExists(file) ?? "";
    const { intention, scenarios } = parseSpecSections(body);
    return {
      file: toPosix(path.relative(projectRoot, file)),
      intention,
      scenarios,
      body,
    };
  });
}

export function collectPremisesExcerpt(projectRoot: string): string {
  const text = readTextIfExists(path.join(projectRoot, DEFAULT_PATHS.premises));
  if (!text) return missingMarker();
  // Keep first ~40 lines / stack + constraints style content
  const lines = text.split(/\r?\n/).slice(0, 40);
  return scrubSecrets(lines.join("\n").trim() || missingMarker());
}

export function collectArtifact(
  projectRoot: string,
  rel: string,
): string {
  return readTextIfExists(path.join(projectRoot, rel)) ?? missingMarker();
}

export type RunChangelogEntry = {
  runId: string;
  updatedAt?: string;
  status?: string;
  summary: string;
};

export function collectRunEntries(projectRoot: string): RunChangelogEntry[] {
  const runsDir = path.join(projectRoot, DEFAULT_PATHS.runs);
  if (!fs.existsSync(runsDir)) return [];
  const ids = fs
    .readdirSync(runsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort()
    .reverse();

  const entries: RunChangelogEntry[] = [];
  for (const runId of ids.slice(0, 20)) {
    const reportPath = [
      path.join(runsDir, runId, "report.json"),
      path.join(runsDir, runId, "run.json"),
    ].find((p) => fs.existsSync(p));
    let status: string | undefined;
    let updatedAt: string | undefined;
    let summary = `Run \`${runId}\``;
    if (reportPath) {
      try {
        const raw = JSON.parse(fs.readFileSync(reportPath, "utf8")) as Record<
          string,
          unknown
        >;
        status =
          typeof raw.status === "string"
            ? raw.status
            : typeof raw.ok === "boolean"
              ? raw.ok
                ? "pass"
                : "fail"
              : undefined;
        updatedAt =
          typeof raw.finishedAt === "string"
            ? raw.finishedAt
            : typeof raw.updatedAt === "string"
              ? raw.updatedAt
              : undefined;
        if (typeof raw.summary === "string") {
          summary = scrubSecrets(raw.summary, 400);
        } else if (status) {
          summary = `Run \`${runId}\` — ${status}`;
        }
      } catch {
        // keep default summary
      }
    }
    entries.push({ runId, status, updatedAt, summary });
  }
  return entries;
}

export function collectEvidenceMeta(
  projectRoot: string,
  evidenceKey: string,
): { updatedAt?: string; status?: string; title?: string; url?: string } | null {
  const encoded = encodeEvidenceKeyForPath(evidenceKey);
  const metaPath = path.join(
    projectRoot,
    DEFAULT_PATHS.evidence,
    encoded,
    "meta.json",
  );
  const text = readTextIfExists(metaPath);
  if (!text) return null;
  try {
    return JSON.parse(text) as {
      updatedAt?: string;
      status?: string;
      title?: string;
      url?: string;
    };
  } catch {
    return null;
  }
}

export function collectTicketLabel(projectRoot: string): {
  label: string;
  block: string;
} {
  const ticketPath = path.join(projectRoot, DEFAULT_PATHS.ticket);
  const text = readTextIfExists(ticketPath);
  if (!text) {
    return {
      label: "_sem ticket_",
      block: "_Nenhum `.sdd/ticket.json` — trabalho local sem ticket._",
    };
  }
  try {
    const raw = JSON.parse(text) as {
      ref?: { provider?: string; id?: string };
      title?: string;
      url?: string;
      evidenceKey?: string;
    };
    const id =
      raw.ref?.provider && raw.ref?.id
        ? `${raw.ref.provider}:${raw.ref.id}`
        : raw.evidenceKey ?? "_ticket_";
    const title = raw.title ? scrubSecrets(raw.title, 200) : "";
    const url = raw.url ? scrubSecrets(raw.url, 300) : "";
    const lines = [
      `- **Id:** \`${id}\``,
      title ? `- **Título:** ${title}` : null,
      url ? `- **URL:** ${url}` : null,
    ].filter(Boolean);
    return { label: id, block: lines.join("\n") };
  } catch {
    return {
      label: "_ticket inválido_",
      block: "_`.sdd/ticket.json` presente mas não pôde ser lido._",
    };
  }
}

export function collectResearchSummary(
  projectRoot: string,
  evidenceKey: string,
): string {
  const encoded = encodeEvidenceKeyForPath(evidenceKey);
  const researchMd = path.join(
    projectRoot,
    DEFAULT_PATHS.research,
    encoded,
    "BEST_PRACTICES.md",
  );
  const text = readTextIfExists(researchMd, 8_000);
  if (!text) {
    // try any research folder
    const root = path.join(projectRoot, DEFAULT_PATHS.research);
    if (!fs.existsSync(root)) return missingMarker();
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(root, entry.name, "BEST_PRACTICES.md");
      const body = readTextIfExists(candidate, 8_000);
      if (body) return body;
    }
    return missingMarker();
  }
  return text;
}

export type AdrCandidate = {
  id: string;
  title: string;
  source: string;
  context: string;
  decision: string;
  consequences: string;
};

/**
 * Pull lightweight ADR candidates from design-approach headings.
 * Does not invent decisions — only sections that already exist.
 */
export function collectAdrCandidates(projectRoot: string): AdrCandidate[] {
  const design = readTextIfExists(
    path.join(projectRoot, DEFAULT_PATHS.designApproach),
  );
  if (!design) return [];

  const candidates: AdrCandidate[] = [];
  const lines = design.split(/\r?\n/);
  let current: { title: string; body: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const body = current.body.join("\n").trim();
    if (!body) return;
    const n = String(candidates.length + 1).padStart(3, "0");
    candidates.push({
      id: n,
      title: current.title,
      source: DEFAULT_PATHS.designApproach,
      context: body.slice(0, 800) || missingMarker(),
      decision: body.slice(0, 800) || missingMarker(),
      consequences: "_Não detalhado no design-approach — completar se necessário._",
    });
  };

  for (const line of lines) {
    const m = /^##\s+(.+)$/.exec(line);
    if (m) {
      flush();
      current = { title: m[1]!.trim(), body: [] };
      continue;
    }
    if (current) current.body.push(line);
  }
  flush();
  return candidates.slice(0, 12);
}

export function collectBugNotes(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, DEFAULT_PATHS.bugs),
    path.join(projectRoot, "docs", "bugs"),
  ];
  const chunks: string[] = [];
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    for (const file of listMarkdownFiles(dir).slice(0, 10)) {
      const body = readTextIfExists(file, 2_000);
      if (body) {
        chunks.push(
          `### ${toPosix(path.relative(projectRoot, file))}\n\n${body}`,
        );
      }
    }
  }
  return chunks.length ? chunks.join("\n\n") : null;
}

/** Detect GraphQL schema or public export stubs — never invent symbols. */
export function collectApiStub(projectRoot: string): {
  body: string;
  sources: string[];
} {
  const sources: string[] = [];
  const chunks: string[] = [];

  const schemaCandidates = [
    "schema.graphql",
    "src/schema.graphql",
    "src/graphql/schema.graphql",
    "graphql/schema.graphql",
  ];
  for (const rel of schemaCandidates) {
    const full = path.join(projectRoot, rel);
    const text = readTextIfExists(full, 12_000);
    if (text) {
      sources.push(rel);
      chunks.push(`### Schema GraphQL (\`${rel}\`)\n\n\`\`\`graphql\n${text.trim()}\n\`\`\``);
      break;
    }
  }

  const exportCandidates = [
    "src/index.ts",
    "src/index.js",
    "src/main.ts",
    "index.ts",
  ];
  for (const rel of exportCandidates) {
    const full = path.join(projectRoot, rel);
    const text = readTextIfExists(full, 6_000);
    if (text) {
      const exportLines = text
        .split(/\r?\n/)
        .filter((l) => /^\s*export\s+/.test(l))
        .slice(0, 40);
      if (exportLines.length) {
        sources.push(rel);
        chunks.push(
          `### Exportações públicas (\`${rel}\`)\n\n\`\`\`ts\n${exportLines.join("\n")}\n\`\`\``,
        );
      }
      break;
    }
  }

  if (!chunks.length) {
    return {
      body: "_Nenhum schema GraphQL ou exportações públicas detectados no projeto. Rode \`sdd docs api\` após adicionar schema/exports — não inventamos a API._",
      sources: [],
    };
  }
  return { body: chunks.join("\n\n"), sources };
}

export function formatChangelogEntries(
  runs: RunChangelogEntry[],
  evidenceMeta: { updatedAt?: string; status?: string; title?: string } | null,
  ticketLabel: string,
  bugNotes: string | null,
): string {
  const lines: string[] = [];
  if (evidenceMeta) {
    lines.push(`### Evidência`, "");
    lines.push(`- Status: ${evidenceMeta.status ?? "_n/d_"}`);
    lines.push(`- Atualizado: ${evidenceMeta.updatedAt ?? "_n/d_"}`);
    if (evidenceMeta.title) {
      lines.push(`- Título: ${scrubSecrets(evidenceMeta.title, 200)}`);
    }
    lines.push(`- Ticket: ${ticketLabel}`, "");
  }
  if (runs.length) {
    lines.push(`### Runs`, "");
    for (const r of runs) {
      const when = r.updatedAt ? ` (${r.updatedAt})` : "";
      const st = r.status ? ` **${r.status}**` : "";
      lines.push(`- \`${r.runId}\`${st}${when} — ${r.summary}`);
    }
    lines.push("");
  } else {
    lines.push("_Nenhum run em `.sdd/runs/` ainda._", "");
  }
  if (bugNotes) {
    lines.push(`### Bugs / QA notes`, "", bugNotes, "");
  }
  if (!lines.length) return missingMarker();
  return lines.filter((l) => l !== null).join("\n");
}
