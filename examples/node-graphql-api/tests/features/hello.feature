# language: pt
Funcionalidade: Hello GraphQL

  @api
  Cenário: Cumprimenta Alice
    Dado que a API GraphQL está pronta
    Quando consulto hello com nome "Alice"
    Então a resposta é "Hello, Alice!"
