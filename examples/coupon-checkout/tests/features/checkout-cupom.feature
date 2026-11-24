# language: pt
Funcionalidade: Checkout — aplicar cupom

  # Intenção: Permitir aplicar um cupom percentual no carrinho antes do pagamento.

  @api
  Cenário: Cupom válido reduz o total
    Dado um carrinho com total 100
    E um cupom "PROMO10" de 10% válido
    Quando o usuário aplica o cupom
    Então o total deve ser 90
    E o recibo deve mostrar o desconto aplicado

  @api
  Cenário: Cupom expirado é rejeitado
    Dado um carrinho com total 100
    E um cupom "OLD10" expirado
    Quando o usuário aplica o cupom
    Então o total permanece 100
    E uma mensagem de erro clara é retornada
