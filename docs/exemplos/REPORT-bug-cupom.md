# Relatório de bug

> Fixture de exemplo para o [guia de uso](../guia-de-uso.md).
> Gerado/refinado como `.sdd/bugs/<id>/REPORT.md` — sem inventar passos.

| Campo | Valor |
|-------|-------|
| **ID** | linear:ENG-99 |
| **Severidade** | alta |
| **Ambiente** | staging · Chrome 131 · Windows |
| **Ticket** | https://linear.app/acme/issue/ENG-99 |
| **Evidence key** | linear:ENG-99 |

## Resumo

Cupom válido `PROMO10` não atualiza o total na tela de checkout.

## Passos para reproduzir

1. Abrir o checkout com carrinho de total 100
2. Informar o cupom `PROMO10`
3. Clicar em **Aplicar cupom**

## Comportamento esperado

- Total passa a 90
- Recibo mostra o desconto aplicado

## Comportamento atual (erro)

- Total permanece 100
- Mensagem de sucesso não aparece (ou some imediatamente)

## Anexos / evidências do cliente

- Screenshot do checkout (sem secrets)
- Horário aproximado: 2026-11-25 14:30 UTC-3

## Notas (humano)

- Reproduzir só com cupom válido; cupom expirado já tem cenário `@ui` nas specs
