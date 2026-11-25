# Premises — coupon-checkout

## Domínio
Checkout com aplicação de cupom percentual no carrinho.

## Stack
- adapter: typescript
- TypeScript (Node)
- Cucumber para cenários `@api` / domínio
- Playwright para cenários `@ui` / `@e2e`
- UI mínima servida em `http://127.0.0.1:4173`

## Tags
- `@api` → Cucumber
- `@ui` / `@e2e` → Playwright
- Sem tag → Cucumber

## Pastas / camadas de teste
Conforme `sdd.yaml` (layout canônico do Protocol Kit):
- Spec Tests: `tests/features` (step 2)
- Unit: `tests/unit` · Integration: `tests/integration` · E2E: `tests/e2e`

## Regras
- Humano edita só `specs/` (+ este arquivo se mudar as regras do jogo) — step 1
- Pipeline não inventa regra de cupom: ambiguidade → ajustar specs
- Dúvidas técnicas → best practices (step 11); premises vencem em conflito
