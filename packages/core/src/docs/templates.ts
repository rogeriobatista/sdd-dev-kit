import type { DocsTemplateVars } from "./types.js";

/** Fill `{{KEY}}` placeholders. Unknown keys become empty string. */
export function fillTemplate(template: string, vars: DocsTemplateVars): string {
  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    return vars[key] ?? "";
  });
}

const MISSING = "_Não informado nas specs / artefatos SDD._";

export const EMBEDDED_TEMPLATES = {
  readme: `# Documentação SDD

Pacote de documentação profissional gerado a partir das **specs** e artefatos do pipeline SDD.

> **Regra:** este material não inventa funcionalidades. A fonte da verdade é \`specs/\` (+ \`.sdd/premises.md\`).

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [PRODUCT.md](./PRODUCT.md) | O que foi pedido (intenção + cenários) |
| [TECHNICAL.md](./TECHNICAL.md) | Dev Spec, Design & Approach, plano |
| [CHANGELOG.md](./CHANGELOG.md) | Histórico a partir de runs / evidência / ticket |
| [HANDOFF.md](./HANDOFF.md) | Handoff para PO / BO / QA / desenvolvimento |
| [ADR/](./ADR/) | Registros de decisão de arquitetura |
| [API.md](./API.md) | Stubs de API / módulos (quando aplicável) |

## Evidência para stakeholders

Abra o demo pack (atualizado in-place):

\`{{EVIDENCE_DEMO_PATH}}\`

## Metadados

- **Gerado em:** {{GENERATED_AT}}
- **Evidence key:** {{EVIDENCE_KEY}}
- **Stack:** {{STACK}}
- **Ticket:** {{TICKET_LABEL}}
`,

  product: `# Produto — o que foi pedido

Documento gerado a partir de \`specs/\` (e canonical, quando existir).  
**Não inventa** critérios de aceite ausentes nas specs.

## Intenção

{{INTENTION}}

## Cenários (Dado / Quando / Então)

{{SCENARIOS}}

## Premissas relevantes

{{PREMISES_EXCERPT}}

## Fontes

{{SOURCES_LIST}}

---

*Se algo estiver incompleto, edite \`specs/\` e rode \`sdd docs\` novamente.*
`,

  technical: `# Técnico — Dev Spec, Design & Approach

Derivado de \`.sdd/dev-spec.md\`, \`.sdd/design-approach.md\` e \`.sdd/implementation-plan.md\`.  
Ausências são marcadas; **não** se inventa arquitetura além do que está nos artefatos / specs.

## Dev Spec

{{DEV_SPEC}}

## Design & Approach

{{DESIGN_APPROACH}}

## Plano de implementação

{{IMPLEMENTATION_PLAN}}

## Pesquisa / boas práticas (se houver)

{{RESEARCH_SUMMARY}}

## Fontes

- \`.sdd/dev-spec.md\`
- \`.sdd/design-approach.md\`
- \`.sdd/implementation-plan.md\`
- \`.sdd/research/\` (quando presente)
`,

  changelog: `# Changelog (SDD)

Histórico sintetizado a partir de runs, evidência e ticket — sem inventar entregas.

## Entradas

{{CHANGELOG_ENTRIES}}

## Como atualizar

\`\`\`text
sdd docs changelog
\`\`\`

---

*Gerado em {{GENERATED_AT}} · evidence key: {{EVIDENCE_KEY}}*
`,

  handoff: `# Handoff — PO / BO / QA / Desenvolvimento

Documento de passagem em português. Baseado apenas em specs, evidência e artefatos SDD.

## Resumo para o solicitante

{{HANDOFF_SUMMARY}}

## O que foi pedido

{{INTENTION}}

## O que foi entregue (conforme evidência)

{{DELIVERED_SUMMARY}}

## Como validar (PO / BO / QA)

1. Abra o demo pack: \`{{EVIDENCE_DEMO_PATH}}\`
2. Confira os cenários em [PRODUCT.md](./PRODUCT.md)
3. Compare com a intenção original nas specs — **não** aceite comportamento inventado fora de \`specs/\`

## Para desenvolvimento

- Técnico: [TECHNICAL.md](./TECHNICAL.md)
- ADRs: [ADR/](./ADR/)
- API / módulos: [API.md](./API.md) (quando gerado)

## Ticket / rastreio

{{TICKET_BLOCK}}

## Pendências / gaps

{{GAPS}}

---

*Gerado em {{GENERATED_AT}} · sem segredos · fonte da verdade: specs/*
`,

  api: `# API / módulos — stubs

Gerado quando o stack expõe schema GraphQL ou exportações públicas.  
**Não inventa** endpoints ou tipos que não existam no código / schema.

## Stack

{{STACK}}

## Conteúdo detectado

{{API_BODY}}

## Fontes

{{API_SOURCES}}

---

*Atualize com \`sdd docs api\` após mudanças de schema/exports.*
`,

  adrIndex: `# ADR — Architecture Decision Records

Decisões extraídas de \`.sdd/design-approach.md\` e \`.sdd/research/\`.  
Entradas ausentes significam que **não** havia decisão registrada — não inventamos.

{{ADR_LIST}}
`,

  adrEntry: `# ADR-{{ADR_ID}}: {{ADR_TITLE}}

- **Status:** {{ADR_STATUS}}
- **Data:** {{ADR_DATE}}
- **Fonte:** {{ADR_SOURCE}}

## Contexto

{{ADR_CONTEXT}}

## Decisão

{{ADR_DECISION}}

## Consequências

{{ADR_CONSEQUENCES}}

---

*Gerado a partir de design/research. Não inventa decisões ausentes nos artefatos.*
`,

  rootChangelog: `# Changelog

Histórico do projeto. Entradas SDD são mantidas em [\`docs/sdd/CHANGELOG.md\`](docs/sdd/CHANGELOG.md).

{{CHANGELOG_ENTRIES}}

---

*Atualizado por \`sdd docs changelog\` em {{GENERATED_AT}}*
`,
} as const;

export function missingMarker(): string {
  return MISSING;
}
