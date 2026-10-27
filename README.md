# Corrida Solidária

Aplicação front-end para cadastrar e administrar as inscrições da 5ª Corrida Solidária da Vila Esperança. A interface funciona em desktop e celular; os dados são mantidos no `localStorage` do navegador.

## Como executar

Requisitos: Node.js 22.12 ou superior na linha 22 e npm.

```bash
npm install
npm start
```

Abra `http://localhost:4200`. Para compilar a aplicação, execute `npm run build`; para rodar os testes unitários, execute `npm test -- --watch=false`.

## Entendimento do problema

O sistema cadastra, lista, consulta, edita e cancela inscrições individuais para a corrida. Cada inscrição recebe nome completo, e-mail, data de nascimento e percurso (5 km ou 10 km). Idade e categoria são derivadas da data oficial da prova, e o painel resume o total de participantes por percurso. A lista é armazenada localmente no navegador, sem API ou sincronização entre dispositivos.

## Regras e fontes

- **Identificação e campos:** nome, e-mail, nascimento e percurso são obrigatórios; normalizamos espaços do nome e removemos espaços externos e diferenças entre maiúsculas/minúsculas do e-mail. Cada endereço normalizado pode ter uma inscrição ativa. Fonte: pacote do cliente, arts. 4º e 7º; enunciado, “Dados e comportamento”.
- **Datas e prova:** a data oficial é 14/03/2027, às 7h, na Praça da Matriz. O nascimento deve ser uma data ISO válida anterior à data local de hoje; a idade é calculada em anos completos no dia da prova, considerando o aniversário nesse próprio dia. Fonte: pacote do cliente, art. 5º, I; enunciado, “Como resolver o pedido do cliente”.
- **Idade e percurso:** a idade mínima é 14 anos; primeiro se verifica essa regra e depois a restrição de 10 km, permitida somente a partir dos 18 anos. Fonte: pacote do cliente, art. 6º, II e III; enunciado, “Regulamento”.
- **Categorias:** Juvenil 14–17, Adulto 18–39, Master 40–59 e Sênior a partir de 60 anos. Idade e categoria são calculadas pela aplicação e não aceitas como dados editáveis. Fonte: pacote do cliente, art. 6º, I e IV; enunciado, “Dados e comportamento”.
- **Cadastro, edição e cancelamento:** a edição altera nome, nascimento e percurso, preserva o e-mail e a posição na lista e recalcula os campos derivados. O cancelamento remove a inscrição e libera o e-mail. Fonte: pacote do cliente, atualização do pedido de 19/10/2026 e art. 7º; enunciado, “Dados e comportamento”.

## Conflitos e decisões

- O áudio diz 13/03/2027; prevalece o regulamento oficial, que fixa a prova em 14/03/2027.
- A mensagem do grupo sugere classificar pelo ano de nascimento; prevalece a idade completa na data da prova, conforme o art. 6º.
- A sugestão de inscrever uma família com um único e-mail conflita com a inscrição individual e a regra de um e-mail por inscrição. O sistema exige um endereço distinto por participante.
- O exemplo de pontos no Gmail não define uma regra geral de equivalência entre provedores. A normalização se limita a espaços externos e caixa; endereços com pontos ou `+` não são transformados em outros endereços.
- O pedido de confirmação por e-mail e geração de Pix é explicitamente opcional no áudio e está fora do escopo do front-end deste teste; não foi implementado.

## Perguntas que permanecem

- Caso se deseje tratar endereços com pontos ou sufixos `+` como a mesma identidade, qual regra deve valer para provedores além do Gmail?
- Como a organização quer registrar o contato de menores que ainda não têm e-mail próprio, sem compartilhar o identificador único da inscrição? O modelo atual segue os quatro campos obrigatórios e não adiciona dados de responsável.
- Em uma evolução com backend, qual política deve ser aplicada à guarda e ao compartilhamento dos dados pessoais dos participantes?

## Fora de escopo

Não há backend, banco de dados, autenticação, autorização de responsáveis, envio de e-mail, pagamento/Pix, bloqueio por prazo de inscrição ou cancelamento, nem sincronização entre abas ou dispositivos. Essas exclusões seguem o enunciado e a delimitação deste teste; a persistência atual é apenas local ao navegador.

## Estrutura principal

- `src/app/dominio/inscricao.regras.ts`: regras puras do regulamento, normalização e formatação.
- `src/app/models/inscricao.model.ts`: tipos dos dados e resultados das operações.
- `src/app/services/inscricao.service.ts`: validação, operações CRUD, estado compartilhado e persistência local.
- `src/app/pages/`: lista, formulário, detalhes e página não encontrada.
- `src/app/app.routes.ts`: rotas Angular para lista, cadastro, consulta, edição e 404.

## Verificações

Verificações executadas neste projeto:

- `npm test -- --watch=false`: 26 testes aprovados, cobrindo regras de idade e categorias, normalização, operações do serviço, rotas e telas de consulta/edição.
- `npm run build`: compilação Angular concluída com sucesso, incluindo os bundles de navegador e servidor e a pré-renderização das rotas estáticas.
