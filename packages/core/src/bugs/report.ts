import fs from "node:fs";
import path from "node:path";
import type { TicketProviderName } from "../types.js";
import {
  evidenceKeyForBug,
  parseBugId,
  type ParsedBugId,
} from "./parse.js";
import {
  resolveBugPaths,
  writeBugMeta,
  type BugMeta,
  type BugPaths,
} from "./paths.js";

export type EnsureBugReportOptions = {
  projectRoot: string;
  /** Ticket id, existing bug id, or omit to generate `bug_<uuid>`. */
  bugId?: string;
  defaultProvider?: TicketProviderName;
  /** Optional title / summary line for the report header. */
  title?: string;
  /** Portuguese REPORT.md body; when omitted, uses built-in PT template. */
  reportTemplate?: string;
  /** Do not overwrite an existing REPORT.md (default true). */
  preserveExisting?: boolean;
};

export type EnsureBugReportResult = {
  parsed: ParsedBugId;
  paths: BugPaths;
  meta: BugMeta;
  created: boolean;
  reportWritten: boolean;
};

const DEFAULT_REPORT_PT = `# Relatório de bug

| Campo | Valor |
|-------|-------|
| **ID** | {{BUG_ID}} |
| **Severidade** | <!-- crítica / alta / média / baixa --> |
| **Ambiente** | <!-- produção / staging / local + browser/OS --> |
| **Ticket** | {{TICKET_LINK}} |
| **Evidence key** | {{EVIDENCE_KEY}} |

## Resumo

<!-- Uma frase do que o cliente reportou -->

## Passos para reproduzir

1.
2.
3.

## Comportamento esperado

-

## Comportamento atual (erro)

-

## Anexos / evidências do cliente

<!-- links, screenshots (sem secrets), logs redigidos -->

-

## Notas (humano)

<!-- Refine este REPORT como faz com specs/; o agente não inventa critérios. -->

-
`;

/**
 * Ensure `.sdd/bugs/<id>/` exists with REPORT.md + meta.json.
 * Human may refine REPORT afterward (like specs).
 */
export function ensureBugReport(
  options: EnsureBugReportOptions,
): EnsureBugReportResult {
  const parsed = parseBugId(options.bugId, {
    defaultProvider: options.defaultProvider,
  });
  const paths = resolveBugPaths(options.projectRoot, parsed);
  const now = new Date().toISOString();
  const preserve = options.preserveExisting !== false;

  fs.mkdirSync(paths.bugDir, { recursive: true });

  const reportExists = fs.existsSync(paths.reportPath);
  let reportWritten = false;
  if (!reportExists || !preserve) {
    const ticketLink = parsed.ticket
      ? `${parsed.ticket.provider}:${parsed.ticket.id}`
      : "(sem ticket — id local)";
    const body = (options.reportTemplate ?? DEFAULT_REPORT_PT)
      .replaceAll("{{BUG_ID}}", parsed.bugId)
      .replaceAll("{{TICKET_LINK}}", ticketLink)
      .replaceAll("{{EVIDENCE_KEY}}", evidenceKeyForBug(parsed))
      .replaceAll("{{TITLE}}", options.title?.trim() || "(sem título)");
    const withTitle = options.title?.trim()
      ? body.replace(
          "# Relatório de bug",
          `# Relatório de bug — ${options.title.trim()}`,
        )
      : body;
    fs.writeFileSync(paths.reportPath, ensureTrailingNewline(withTitle), "utf8");
    reportWritten = true;
  }

  const existingMeta = fs.existsSync(paths.metaPath)
    ? (JSON.parse(fs.readFileSync(paths.metaPath, "utf8")) as BugMeta)
    : null;

  const meta: BugMeta = {
    bugId: parsed.bugId,
    kind: parsed.kind,
    evidenceKey: evidenceKeyForBug(parsed),
    encodedId: paths.encodedId,
    createdAt: existingMeta?.createdAt ?? now,
    updatedAt: now,
    ticket: parsed.ticket,
    regressionTest: existingMeta?.regressionTest ?? null,
    status: existingMeta?.status ?? "reported",
  };
  writeBugMeta(paths.bugDir, meta);

  return {
    parsed,
    paths,
    meta,
    created: !existingMeta,
    reportWritten,
  };
}

/**
 * Write DEBUG.md or QA.md from a template if missing (or always when preserve=false).
 */
export function ensureBugArtifact(
  projectRoot: string,
  bugId: string,
  artifact: "DEBUG.md" | "QA.md",
  templateBody: string,
  options?: { preserveExisting?: boolean; defaultProvider?: TicketProviderName },
): { paths: BugPaths; written: boolean } {
  const paths = resolveBugPaths(projectRoot, bugId, {
    defaultProvider: options?.defaultProvider,
  });
  fs.mkdirSync(paths.bugDir, { recursive: true });
  const target =
    artifact === "DEBUG.md" ? paths.debugPath : paths.qaPath;
  const preserve = options?.preserveExisting !== false;
  if (fs.existsSync(target) && preserve) {
    return { paths, written: false };
  }
  const body = templateBody
    .replaceAll("{{BUG_ID}}", paths.bugId)
    .replaceAll("{{EVIDENCE_KEY}}", paths.evidenceKey);
  fs.writeFileSync(target, ensureTrailingNewline(body), "utf8");
  return { paths, written: true };
}

/** Load a shared template file if present; else return fallback. */
export function loadBugTemplate(
  projectRoot: string,
  name: "REPORT.md" | "DEBUG.md" | "QA.md",
  fallback: string,
): string {
  const candidates = [
    path.join(projectRoot, ".sdd", "bugs", "_templates", name),
    path.join(projectRoot, "node_modules", "@rogeriobatista", "adapter-shared", "templates", ".sdd", "bugs", "_templates", name),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return fs.readFileSync(c, "utf8");
    }
  }
  return fallback;
}

export const BUILTIN_REPORT_TEMPLATE_PT = DEFAULT_REPORT_PT;

export const BUILTIN_DEBUG_TEMPLATE_PT = `# Diagnóstico (DEBUG)

| Campo | Valor |
|-------|-------|
| **Bug ID** | {{BUG_ID}} |
| **Evidence key** | {{EVIDENCE_KEY}} |
| **Data** | <!-- ISO-8601 --> |

## Hipótese

-

## Evidências consultadas

- Relatório: \`.sdd/bugs/…/REPORT.md\`
- Testes que falham:
- Logs (redigidos, sem secrets):
- Pack de evidência / demo:
- Research / boas práticas (se incerteza):

## Passos de diagnóstico

1.
2.

## Causa raiz (quando conhecida)

-

## Próximo passo

- [ ] \`reproduce\` — regressão falhando existe
- [ ] \`fix\` — só após regressão vermelha
- [ ] \`qa\` — checklist após verde
`;

export const BUILTIN_QA_TEMPLATE_PT = `# QA — sign-off

| Campo | Valor |
|-------|-------|
| **Bug ID** | {{BUG_ID}} |
| **Evidence key** | {{EVIDENCE_KEY}} |
| **Severidade original** | |
| **Reteste em** | <!-- ambiente --> |
| **Resultado** | <!-- aprovado / reprovado / bloqueado --> |

## Matriz de regressão

| Cenário / teste | Antes | Depois | Notas |
|-----------------|-------|--------|-------|
| Regressão do bug | falha | | |
| Suite existente | | | |

## Checklist

- [ ] Regressão do bug passa
- [ ] Suite existente (spec/unit/integration/e2e) passa
- [ ] Evidence/demo atualizado em \`.sdd/evidence/<key>/latest/\`
- [ ] Sem secrets em anexos ou logs
- [ ] Severidade reavaliada

## Notas de reteste

-

## Assinatura QA

| Quem | Data | Decisão |
|------|------|---------|
| | | |
`;

function ensureTrailingNewline(text: string): string {
  return text.endsWith("\n") ? text : `${text}\n`;
}
