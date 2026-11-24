# Greeting module

## Intenção
Expor um módulo Terraform local (null provider) com variável `greeting`.

## Cenários

### Default greeting @api
Dado um módulo com defaults
Quando planejo a infraestrutura
Então greeting é "hello"

### Custom greeting @api
Dado greeting "ola"
Quando planejo a infraestrutura
Então greeting é "ola"
