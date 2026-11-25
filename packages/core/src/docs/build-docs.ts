import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PATHS } from "../paths.js";
import {
  encodeEvidenceKeyForPath,
  resolveEvidenceKey,
} from "../demo/evidence-pack.js";
import { detectStack } from "../stack.js";
import {
  collectAdrCandidates,
  collectApiStub,
  collectArtifact,
  collectBugNotes,
  collectEvidenceMeta,
  collectPremisesExcerpt,
  collectResearchSummary,
  collectRunEntries,
  collectSpecs,
  collectTicketLabel,
  formatChangelogEntries,
} from "./collect.js";
import {
  adrRelPath,
  DOCS_FILES,
  docsFileRelPath,
  docsPackRelPath,
  evidenceDemoRelPath,
} from "./paths.js";
import { EMBEDDED_TEMPLATES, fillTemplate, missingMarker } from "./templates.js";
import type { BuildDocsOptions, BuildDocsResult, DocsMode } from "./types.js";

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function writeFile(abs: string, body: string, written: string[]): void {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const text = body.endsWith("\n") ? body : `${body}\n`;
  fs.writeFileSync(abs, text, "utf8");
  written.push(toPosix(abs));
}

function joinIntention(specs: ReturnType<typeof collectSpecs>): string {
  const parts = specs
    .map((s) => s.intention)
    .filter((x): x is string => Boolean(x && x.trim()));
  if (!parts.length) {
    // fall back to first non-empty body excerpt — still from specs, not invented
    const body = specs.find((s) => s.body.trim())?.body.trim();
    if (body) return body.slice(0, 1500);
    return missingMarker();
  }
  return parts.join("\n\n---\n\n");
}

function joinScenarios(specs: ReturnType<typeof collectSpecs>): string {
  const parts = specs
    .map((s) => {
      if (s.scenarios) return `### ${s.file}\n\n${s.scenarios}`;
      // Keep GWT lines if section missing
      const gwt = s.body
        .split(/\r?\n/)
        .filter((l) => /^(Dado|Quando|Então|E|Given|When|Then|And)\b/i.test(l.trim()))
        .join("\n");
      return gwt ? `### ${s.file}\n\n${gwt}` : null;
    })
    .filter((x): x is string => Boolean(x));
  return parts.length ? parts.join("\n\n") : missingMarker();
}

/**
 * Build / refresh the professional documentation pack under `docs/sdd/`.
 * Never invents product features — missing sources become explicit gaps.
 */
export function buildDocs(options: BuildDocsOptions): BuildDocsResult {
  const projectRoot = path.resolve(options.projectRoot);
  const mode: DocsMode = options.mode ?? "all";
  const generatedAt = new Date().toISOString();
  const written: string[] = [];
  const gaps: string[] = [];

  const evidenceResolved = resolveEvidenceKey({
    projectRoot,
    evidenceKey: options.evidenceKey,
  });
  const evidenceKey = evidenceResolved.evidenceKey;
  const encoded = encodeEvidenceKeyForPath(evidenceKey);
  const evidenceDemoPath = evidenceDemoRelPath(encoded);

  const stackDetection = detectStack(projectRoot);
  const stack = stackDetection.stack;
  if (stackDetection.needsClarification) {
    gaps.push("Stack ausente ou ambígua — declare em `.sdd/premises.md`.");
  }

  const specs = collectSpecs(projectRoot);
  if (!specs.length) gaps.push("Nenhuma spec em `specs/` (exceto `_example`).");

  const ticket = collectTicketLabel(projectRoot);
  const intention = joinIntention(specs);
  const scenarios = joinScenarios(specs);
  const premises = collectPremisesExcerpt(projectRoot);
  const sourcesList = specs.length
    ? specs.map((s) => `- \`${s.file}\``).join("\n")
    : missingMarker();

  const devSpec = collectArtifact(projectRoot, DEFAULT_PATHS.devSpec);
  const design = collectArtifact(projectRoot, DEFAULT_PATHS.designApproach);
  const plan = collectArtifact(projectRoot, DEFAULT_PATHS.implementationPlan);
  if (devSpec === missingMarker()) gaps.push("`.sdd/dev-spec.md` ausente.");
  if (design === missingMarker()) gaps.push("`.sdd/design-approach.md` ausente.");
  if (plan === missingMarker()) gaps.push("`.sdd/implementation-plan.md` ausente.");

  const research = collectResearchSummary(projectRoot, evidenceKey);
  const runs = collectRunEntries(projectRoot);
  const evidenceMeta = collectEvidenceMeta(projectRoot, evidenceKey);
  const bugNotes = collectBugNotes(projectRoot);
  const changelogEntries = formatChangelogEntries(
    runs,
    evidenceMeta,
    ticket.label,
    bugNotes,
  );

  const baseVars = {
    GENERATED_AT: generatedAt,
    EVIDENCE_KEY: evidenceKey,
    EVIDENCE_DEMO_PATH: evidenceDemoPath,
    STACK: stack ?? "_não detectado_",
    TICKET_LABEL: ticket.label,
    TICKET_BLOCK: ticket.block,
    INTENTION: intention,
    SCENARIOS: scenarios,
    PREMISES_EXCERPT: premises,
    SOURCES_LIST: sourcesList,
    DEV_SPEC: devSpec,
    DESIGN_APPROACH: design,
    IMPLEMENTATION_PLAN: plan,
    RESEARCH_SUMMARY: research,
    CHANGELOG_ENTRIES: changelogEntries,
    GAPS: gaps.length
      ? gaps.map((g) => `- ${g}`).join("\n")
      : "_Nenhum gap estrutural detectado._",
    HANDOFF_SUMMARY: specs.length
      ? `Documentação gerada a partir de ${specs.length} spec(s) e artefatos SDD para \`${evidenceKey}\`.`
      : "Aguardando specs — não há produto documentável sem `specs/`.",
    DELIVERED_SUMMARY: evidenceMeta
      ? `Evidência \`${evidenceKey}\` — status: ${evidenceMeta.status ?? "n/d"}; atualizado: ${evidenceMeta.updatedAt ?? "n/d"}. Demo: \`${evidenceDemoPath}\`.`
      : `Pacote de evidência ainda não materializado. Após verify/demo, abra \`${evidenceDemoPath}\`.`,
  };

  const docsDir = path.join(projectRoot, docsPackRelPath());
  fs.mkdirSync(docsDir, { recursive: true });

  const writeRootChangelog =
    options.writeRootChangelog ?? (mode === "all" || mode === "changelog");

  const writeChangelog = () => {
    writeFile(
      path.join(projectRoot, docsFileRelPath(DOCS_FILES.changelog)),
      fillTemplate(EMBEDDED_TEMPLATES.changelog, baseVars),
      written,
    );
    if (writeRootChangelog) {
      writeFile(
        path.join(projectRoot, "CHANGELOG.md"),
        fillTemplate(EMBEDDED_TEMPLATES.rootChangelog, baseVars),
        written,
      );
    }
  };

  const writeHandoff = () => {
    writeFile(
      path.join(projectRoot, docsFileRelPath(DOCS_FILES.handoff)),
      fillTemplate(EMBEDDED_TEMPLATES.handoff, baseVars),
      written,
    );
  };

  const writeApi = () => {
    const api = collectApiStub(projectRoot);
    if (!api.sources.length) {
      gaps.push("API stubs: nenhum schema/export detectado.");
    }
    writeFile(
      path.join(projectRoot, docsFileRelPath(DOCS_FILES.api)),
      fillTemplate(EMBEDDED_TEMPLATES.api, {
        ...baseVars,
        API_BODY: api.body,
        API_SOURCES: api.sources.length
          ? api.sources.map((s) => `- \`${s}\``).join("\n")
          : missingMarker(),
      }),
      written,
    );
  };

  const writeAdr = () => {
    const adrs = collectAdrCandidates(projectRoot);
    const adrDir = path.join(projectRoot, docsFileRelPath(DOCS_FILES.adrDir));
    fs.mkdirSync(adrDir, { recursive: true });
    if (!adrs.length) {
      writeFile(
        path.join(projectRoot, docsFileRelPath(DOCS_FILES.adrIndex)),
        fillTemplate(EMBEDDED_TEMPLATES.adrIndex, {
          ADR_LIST:
            "_Nenhuma seção de decisão encontrada em design-approach. ADRs não foram inventados._",
        }),
        written,
      );
      return;
    }
    const listLines: string[] = [];
    for (const adr of adrs) {
      const slug = `adr-${adr.id}-${adr.title}`;
      const rel = adrRelPath(slug);
      writeFile(
        path.join(projectRoot, rel),
        fillTemplate(EMBEDDED_TEMPLATES.adrEntry, {
          ADR_ID: adr.id,
          ADR_TITLE: adr.title,
          ADR_STATUS: "registrado",
          ADR_DATE: generatedAt.slice(0, 10),
          ADR_SOURCE: adr.source,
          ADR_CONTEXT: adr.context,
          ADR_DECISION: adr.decision,
          ADR_CONSEQUENCES: adr.consequences,
        }),
        written,
      );
      listLines.push(`- [ADR-${adr.id}: ${adr.title}](./${path.basename(rel)})`);
    }
    writeFile(
      path.join(projectRoot, docsFileRelPath(DOCS_FILES.adrIndex)),
      fillTemplate(EMBEDDED_TEMPLATES.adrIndex, {
        ADR_LIST: listLines.join("\n"),
      }),
      written,
    );
  };

  if (mode === "changelog") {
    writeChangelog();
  } else if (mode === "handoff") {
    writeHandoff();
  } else if (mode === "api") {
    writeApi();
  } else {
    writeFile(
      path.join(projectRoot, docsFileRelPath(DOCS_FILES.readme)),
      fillTemplate(EMBEDDED_TEMPLATES.readme, baseVars),
      written,
    );
    writeFile(
      path.join(projectRoot, docsFileRelPath(DOCS_FILES.product)),
      fillTemplate(EMBEDDED_TEMPLATES.product, baseVars),
      written,
    );
    writeFile(
      path.join(projectRoot, docsFileRelPath(DOCS_FILES.technical)),
      fillTemplate(EMBEDDED_TEMPLATES.technical, baseVars),
      written,
    );
    writeChangelog();
    writeHandoff();
    writeAdr();
    writeApi();
  }

  return {
    mode,
    docsDir: toPosix(docsDir),
    docsPath: docsPackRelPath(),
    evidenceKey,
    evidenceDemoPath,
    written: written.map((w) =>
      toPosix(path.relative(projectRoot, w)).replace(/^\.\//, ""),
    ),
    gaps,
    stack,
  };
}
