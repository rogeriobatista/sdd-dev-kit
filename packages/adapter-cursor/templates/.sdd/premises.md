# Premises do projeto

## Stack
- adapter: typescript
- TypeScript
- Aceitação/domínio: Cucumber (`@cucumber/cucumber`) — Spec Tests (step 2)
- UI/E2E: Playwright (`@playwright/test`) — e2e layer (step 8)

## Tags
- `@api` → Cucumber (sem browser quando possível)
- `@ui` / `@e2e` → Playwright
- Sem tag → Cucumber por padrão

## Camadas de teste (steps 2 / 6 / 7 / 8)
- Spec Tests: `tests/features` (ou `tests/spec` se configurado)
- Unit: `tests/unit`
- Integration: `tests/integration`
- E2E: `tests/e2e`

## Idioma dos specs
- Português: `Dado` / `Quando` / `Então` / `E`
- Prosa em `## Intenção` + cenários em `###`

## Fronteiras
- Humano edita só `specs/` e este arquivo quando necessário (step 1)
- Artefatos regeneráveis: Spec Tests, `.sdd/dev-spec.md`, `.sdd/implementation-plan.md`, `.sdd/design-approach.md`, `tests/unit|integration|e2e`, `.sdd/canonical`, `.sdd/research`, evidence

## Estilo
- Preferir cenários curtos e testáveis
- Não inventar regra de negócio na normalização — pedir clarificação no spec
- Dúvidas técnicas → best practices (step 11); premises vencem em conflito
