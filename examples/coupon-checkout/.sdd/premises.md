# Premises — coupon-checkout

## Domínio
Checkout com aplicação de cupom percentual no carrinho.

## Stack
- TypeScript (Node)
- Cucumber para cenários `@api` / domínio
- Playwright para cenários `@ui` / `@e2e`
- UI mínima servida em `http://127.0.0.1:4173`

## Tags
- `@api` → Cucumber
- `@ui` / `@e2e` → Playwright
- Sem tag → Cucumber

## Pastas
Conforme `sdd.yaml` (layout canônico do Protocol Kit).

## Regras
- Humano edita só `specs/` (+ este arquivo se mudar as regras do jogo)
- Pipeline não inventa regra de cupom: ambiguidade → ajustar specs
