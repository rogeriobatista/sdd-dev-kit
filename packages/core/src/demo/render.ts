import type { PhaseStatus } from "../types.js";
import type {
  DemoFeature,
  DemoManifest,
  EvidenceFile,
  ScenarioDemoStatus,
} from "./types.js";

const STATUS_PT: Record<ScenarioDemoStatus, string> = {
  passed: "Passou",
  failed: "Falhou",
  skipped: "Ignorado",
  unknown: "Sem evidência",
};

const OVERALL_PT: Record<string, string> = {
  passed: "Aprovado",
  failed: "Reprovado",
  pending: "Pendente",
  running: "Em execução",
  blocked: "Bloqueado",
  skipped: "Ignorado",
  unknown: "Indeterminado",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status: ScenarioDemoStatus): string {
  return `status-${status}`;
}

function mediaHref(file: EvidenceFile): string {
  return file.demoRelativePath ?? file.relativePath;
}

export interface RenderInput {
  runId: string;
  generatedAt: string;
  overallStatus: ScenarioDemoStatus | PhaseStatus;
  features: DemoFeature[];
  evidence: EvidenceFile[];
  missingEvidence: string[];
  notes: string[];
  locale: "pt-BR" | "en";
}

export function renderSummaryMarkdown(input: RenderInput): string {
  const overall =
    OVERALL_PT[input.overallStatus] ?? String(input.overallStatus);
  const lines: string[] = [
    `# Demo de evidências — execução \`${input.runId}\``,
    "",
    `**Público:** PO / BO / QA`,
    `**Gerado em:** ${input.generatedAt}`,
    `**Status geral:** ${overall}`,
    "",
    "## Resumo",
    "",
  ];

  if (input.features.length === 0) {
    lines.push(
      "_Nenhuma intenção/cenário de negócio encontrado nas specs — veja as evidências abaixo._",
      "",
    );
  }

  for (const feature of input.features) {
    lines.push(`## ${feature.title}`, "");
    if (feature.intention) {
      lines.push(`**Intenção:** ${feature.intention}`, "");
    }
    for (const scenario of feature.scenarios) {
      const st = STATUS_PT[scenario.status];
      lines.push(`### ${scenario.title}`, "");
      lines.push(`- **Resultado:** ${st}`);
      if (scenario.tags.length) {
        lines.push(`- **Tags:** ${scenario.tags.map((t) => `@${t}`).join(" ")}`);
      }
      if (scenario.detail) {
        lines.push(`- **Detalhe:** ${scenario.detail}`);
      }
      if (scenario.steps.length) {
        lines.push("", "**Passos (linguagem de negócio):**", "");
        for (const step of scenario.steps) {
          lines.push(`- ${step.keyword} ${step.text}`);
        }
      }
      if (scenario.evidence.length) {
        lines.push("", "**Evidências:**", "");
        for (const ev of scenario.evidence) {
          lines.push(`- [${ev.label}](${mediaHref(ev)})`);
        }
      }
      lines.push("");
    }
  }

  lines.push("## Evidências coletadas", "");
  if (input.evidence.length === 0) {
    lines.push("_Nenhum arquivo de evidência encontrado._", "");
  } else {
    for (const ev of input.evidence) {
      lines.push(`- **${ev.label}** (\`${ev.kind}\`): [${mediaHref(ev)}](${mediaHref(ev)})`);
    }
    lines.push("");
  }

  if (input.missingEvidence.length) {
    lines.push("## Evidências não encontradas (ok — demo segue com o disponível)", "");
    for (const m of input.missingEvidence) {
      lines.push(`- ${m}`);
    }
    lines.push("");
  }

  if (input.notes.length) {
    lines.push("## Notas", "");
    for (const n of input.notes) lines.push(`- ${n}`);
    lines.push("");
  }

  lines.push(
    "---",
    "_Pacote gerado por `/sdd demo` — sem código-fonte; apenas intenção, cenários e evidências de teste._",
    "",
  );
  return lines.join("\n");
}

export function renderIndexHtml(input: RenderInput): string {
  const overall =
    OVERALL_PT[input.overallStatus] ?? String(input.overallStatus);
  const featureBlocks = input.features
    .map((feature) => {
      const intention = feature.intention
        ? `<p class="intention">${escapeHtml(feature.intention)}</p>`
        : "";
      const scenarios = feature.scenarios
        .map((scenario) => {
          const steps = scenario.steps.length
            ? `<ol class="steps">${scenario.steps
                .map(
                  (s) =>
                    `<li><span class="kw">${escapeHtml(String(s.keyword))}</span> ${escapeHtml(s.text)}</li>`,
                )
                .join("")}</ol>`
            : "";
          const detail = scenario.detail
            ? `<p class="detail">${escapeHtml(scenario.detail)}</p>`
            : "";
          const tags = scenario.tags.length
            ? `<p class="tags">${scenario.tags
                .map((t) => `<span class="tag">@${escapeHtml(t)}</span>`)
                .join(" ")}</p>`
            : "";
          const media = scenario.evidence
            .map((ev) => {
              const href = mediaHref(ev);
              if (ev.kind === "screenshot") {
                return `<figure class="media"><img src="${escapeHtml(href)}" alt="${escapeHtml(ev.label)}" /><figcaption>${escapeHtml(ev.label)}</figcaption></figure>`;
              }
              if (ev.kind === "video") {
                return `<figure class="media"><video controls src="${escapeHtml(href)}"></video><figcaption>${escapeHtml(ev.label)}</figcaption></figure>`;
              }
              return `<p class="link"><a href="${escapeHtml(href)}">${escapeHtml(ev.label)}</a></p>`;
            })
            .join("");
          return `<article class="scenario ${statusClass(scenario.status)}">
  <header>
    <h3>${escapeHtml(scenario.title)}</h3>
    <span class="badge ${statusClass(scenario.status)}">${STATUS_PT[scenario.status]}</span>
  </header>
  ${tags}
  ${detail}
  ${steps}
  ${media}
</article>`;
        })
        .join("\n");
      return `<section class="feature">
  <h2>${escapeHtml(feature.title)}</h2>
  ${intention}
  ${scenarios}
</section>`;
    })
    .join("\n");

  const evidenceList = input.evidence.length
    ? `<ul class="evidence-list">${input.evidence
        .map(
          (ev) =>
            `<li><a href="${escapeHtml(mediaHref(ev))}">${escapeHtml(ev.label)}</a> <span class="muted">(${escapeHtml(ev.kind)})</span></li>`,
        )
        .join("")}</ul>`
    : `<p class="muted">Nenhum arquivo de evidência encontrado nesta execução.</p>`;

  const missing = input.missingEvidence.length
    ? `<details class="missing"><summary>Evidências opcionais não encontradas</summary><ul>${input.missingEvidence
        .map((m) => `<li>${escapeHtml(m)}</li>`)
        .join("")}</ul></details>`
    : "";

  const notes = input.notes.length
    ? `<section class="notes"><h2>Notas</h2><ul>${input.notes
        .map((n) => `<li>${escapeHtml(n)}</li>`)
        .join("")}</ul></section>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Demo SDD — ${escapeHtml(input.runId)}</title>
  <style>
    :root {
      --bg: #f6f3ee;
      --ink: #1c1917;
      --muted: #57534e;
      --line: #d6d3d1;
      --pass: #166534;
      --pass-bg: #dcfce7;
      --fail: #991b1b;
      --fail-bg: #fee2e2;
      --skip: #92400e;
      --skip-bg: #fef3c7;
      --unk: #44403c;
      --unk-bg: #e7e5e4;
      --card: #fffdf9;
      --accent: #0f766e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      background:
        radial-gradient(1200px 600px at 10% -10%, #ccfbf1 0%, transparent 55%),
        radial-gradient(900px 500px at 100% 0%, #fed7aa 0%, transparent 50%),
        var(--bg);
      line-height: 1.5;
    }
    header.hero {
      padding: 2.5rem 1.5rem 1.5rem;
      max-width: 920px;
      margin: 0 auto;
    }
    header.hero .brand {
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 700;
    }
    h1 { font-size: 1.85rem; margin: 0.35rem 0 0.5rem; font-weight: 700; }
    .meta { color: var(--muted); font-size: 0.95rem; }
    .overall {
      display: inline-block;
      margin-top: 0.75rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-weight: 600;
      background: var(--unk-bg);
    }
    .overall.status-passed { background: var(--pass-bg); color: var(--pass); }
    .overall.status-failed { background: var(--fail-bg); color: var(--fail); }
    main { max-width: 920px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .feature {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 1.25rem 1.35rem;
      margin-bottom: 1.25rem;
    }
    .feature h2 { margin: 0 0 0.5rem; font-size: 1.35rem; }
    .intention { color: var(--muted); margin: 0 0 1rem; }
    .scenario {
      border-top: 1px solid var(--line);
      padding: 1rem 0 0.25rem;
      margin-top: 0.75rem;
    }
    .scenario header {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
      align-items: baseline;
      justify-content: space-between;
    }
    .scenario h3 { margin: 0; font-size: 1.1rem; }
    .badge {
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      background: var(--unk-bg);
      color: var(--unk);
    }
    .badge.status-passed, .status-passed .badge { background: var(--pass-bg); color: var(--pass); }
    .badge.status-failed, .status-failed .badge { background: var(--fail-bg); color: var(--fail); }
    .badge.status-skipped { background: var(--skip-bg); color: var(--skip); }
    .steps { margin: 0.5rem 0 0.75rem; padding-left: 1.2rem; }
    .kw { font-weight: 700; color: var(--accent); }
    .tag {
      display: inline-block;
      font-size: 0.75rem;
      background: #ecfeff;
      color: #0e7490;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      margin-right: 0.25rem;
    }
    .detail { color: var(--fail); font-size: 0.9rem; }
    .media { margin: 0.75rem 0; }
    .media img, .media video {
      max-width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
    }
    figcaption { font-size: 0.8rem; color: var(--muted); margin-top: 0.25rem; }
    .evidence-list { padding-left: 1.2rem; }
    .muted { color: var(--muted); }
    .missing { margin-top: 1rem; color: var(--muted); }
    footer {
      max-width: 920px;
      margin: 0 auto;
      padding: 0 1.5rem 2.5rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header class="hero">
    <div class="brand">SDD · Demo para stakeholders</div>
    <h1>Evidências da execução <code>${escapeHtml(input.runId)}</code></h1>
    <p class="meta">Para PO / BO / QA · gerado em ${escapeHtml(input.generatedAt)} · pacote offline (caminhos relativos)</p>
    <div class="overall ${statusClass(normalizeOverall(input.overallStatus))}">Status geral: ${escapeHtml(overall)}</div>
  </header>
  <main>
    ${featureBlocks || `<section class="feature"><p class="muted">Nenhuma intenção/cenário de negócio encontrado. O pacote ainda inclui evidências e o resumo da execução.</p></section>`}
    <section class="feature">
      <h2>Arquivos de evidência</h2>
      ${evidenceList}
      ${missing}
    </section>
    ${notes}
  </main>
  <footer>
    Gerado por <strong>/sdd demo</strong> a partir de specs (linguagem de negócio) e evidências de teste.
    Sem dumps de código e sem segredos.
  </footer>
</body>
</html>
`;
}

function normalizeOverall(
  status: ScenarioDemoStatus | PhaseStatus | string,
): ScenarioDemoStatus {
  if (status === "passed" || status === "failed" || status === "skipped") {
    return status;
  }
  return "unknown";
}

export function buildManifest(input: RenderInput & { projectRoot: string }): DemoManifest {
  return {
    version: 1,
    generatedAt: input.generatedAt,
    runId: input.runId,
    projectRoot: input.projectRoot,
    locale: input.locale,
    overallStatus: normalizeOverall(input.overallStatus) as PhaseStatus | "unknown",
    features: input.features.map((f) => ({
      title: f.title,
      intention: f.intention,
      sourceFile: f.sourceFile,
      scenarios: f.scenarios.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        tags: s.tags,
        evidence: s.evidence.map((e) => ({
          kind: e.kind,
          path: mediaHref(e),
          label: e.label,
        })),
      })),
    })),
    evidence: input.evidence.map((e) => ({
      kind: e.kind,
      path: mediaHref(e),
      label: e.label,
      sourceRelativePath: e.relativePath,
    })),
    missingEvidence: input.missingEvidence,
    notes: input.notes,
  };
}
