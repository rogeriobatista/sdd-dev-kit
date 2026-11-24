# Checkout — aplicar cupom

## Intenção
Permitir aplicar um cupom percentual no carrinho antes do pagamento.
Cupons expirados ou inválidos não alteram o total.
O usuário deve ver o desconto no recibo quando o cupom é válido, e uma mensagem clara quando é rejeitado.

## Cenários

### Cupom válido reduz o total @api
Dado um carrinho com total 100
E um cupom "PROMO10" de 10% válido
Quando o usuário aplica o cupom
Então o total deve ser 90
E o recibo deve mostrar o desconto aplicado

### Cupom expirado é rejeitado @api
Dado um carrinho com total 100
E um cupom "OLD10" expirado
Quando o usuário aplica o cupom
Então o total permanece 100
E uma mensagem de erro clara é retornada

### Cupom válido aparece na tela de checkout @ui
Dado que o usuário está no checkout com total 100
E um cupom "PROMO10" de 10% válido está disponível
Quando o usuário informa o cupom e confirma
Então a tela mostra total 90
E exibe o desconto aplicado

### Cupom expirado mostra erro na tela @ui
Dado que o usuário está no checkout com total 100
E um cupom "OLD10" expirado está cadastrado
Quando o usuário informa o cupom e confirma
Então a tela mantém total 100
E exibe uma mensagem de erro clara
