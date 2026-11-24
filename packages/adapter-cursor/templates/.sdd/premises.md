# Premises do projeto

## Stack
- TypeScript
- Aceitação/domínio: Cucumber (`@cucumber/cucumber`)
- UI/E2E: Playwright (`@playwright/test`)

## Tags
- `@api` → Cucumber (sem browser quando possível)
- `@ui` / `@e2e` → Playwright
- Sem tag → Cucumber por padrão

## Idioma dos specs
- Português: `Dado` / `Quando` / `Então` / `E`
- Prosa em `## Intenção` + cenários em `###`

## Fronteiras
- Humano edita só `specs/` e este arquivo quando necessário
- Artefatos em `tests/`, `.sdd/canonical`, `.sdd/plan` são regeneráveis

## Estilo
- Preferir cenários curtos e testáveis
- Não inventar regra de negócio na normalização — pedir clarificação no spec
