# Corrida Solidária — entrega do teste

## Como rodar

- **Requisitos:** Node.js 22.12 ou superior na linha 22 e npm.
- **Instalação:** `npm install`
- **Execução:** `npm start` e abrir `http://localhost:4200`
- **Build:** `npm run build`
- **Testes unitários:** `npm test -- --watch=false`

## Entendimento do problema

A associação precisa cadastrar, listar, consultar, editar e cancelar inscrições individuais da 5ª Corrida Solidária da Vila Esperança.
Cada inscrição tem nome completo, e-mail, data de nascimento e percurso (5 km ou 10 km).
Idade e categoria são derivadas da data oficial da prova (14/03/2027) e o painel resume o total de participantes por percurso.
Os dados ficam no `localStorage` do navegador, sem API nem sincronização entre dispositivos.
A interface funciona em desktop e celular.

## Regras implementadas

| Regra | Fonte no pedido | Onde foi implementada |
| --- | --- | --- |
| Nome, e-mail, nascimento e percurso são obrigatórios; o nome tem espaços normalizados e o e-mail tem espaços externos e caixa normalizados | Pacote do cliente, arts. 4º e 7º; enunciado, “Dados e comportamento” | `src/app/dominio/inscricao.regras.ts` (normalização) e `src/app/services/inscricao.service.ts` (validação) |
| Cada e-mail normalizado pode ter apenas uma inscrição ativa | Pacote do cliente, arts. 4º e 7º; enunciado, “Dados e comportamento” | `src/app/services/inscricao.service.ts` |
| Data oficial da prova: 14/03/2027, às 7h, na Praça da Matriz | Pacote do cliente, art. 5º, I; enunciado, “Como resolver o pedido do cliente” | `src/app/dominio/inscricao.regras.ts` |
| Nascimento deve ser uma data ISO válida e anterior à data local de hoje | Pacote do cliente, art. 5º, I; enunciado, “Como resolver o pedido do cliente” | `src/app/dominio/inscricao.regras.ts` e `src/app/services/inscricao.service.ts` |
| Idade em anos completos na data da prova, contando o aniversário no próprio dia | Pacote do cliente, art. 5º, I; enunciado, “Como resolver o pedido do cliente” | `src/app/dominio/inscricao.regras.ts` |
| Idade mínima de 14 anos, verificada antes da restrição de percurso | Pacote do cliente, art. 6º, II; enunciado, “Regulamento” | `src/app/dominio/inscricao.regras.ts` e `src/app/services/inscricao.service.ts` |
| Percurso de 10 km permitido somente a partir dos 18 anos | Pacote do cliente, art. 6º, III; enunciado, “Regulamento” | `src/app/dominio/inscricao.regras.ts` e `src/app/services/inscricao.service.ts` |
| Categorias: Juvenil 14–17, Adulto 18–39, Master 40–59, Sênior 60+; idade e categoria calculadas, nunca editáveis | Pacote do cliente, art. 6º, I e IV; enunciado, “Dados e comportamento” | `src/app/dominio/inscricao.regras.ts` e `src/app/models/inscricao.model.ts` |
| Edição altera nome, nascimento e percurso, preserva e-mail e posição na lista e recalcula idade e categoria | Pacote do cliente, atualização do pedido de 19/10/2026; enunciado, “Dados e comportamento” | `src/app/services/inscricao.service.ts` e `src/app/pages/` (formulário) |
| Cancelamento remove a inscrição e libera o e-mail | Pacote do cliente, art. 7º; enunciado, “Dados e comportamento” | `src/app/services/inscricao.service.ts` |
| Persistência local no navegador | Enunciado, delimitação do teste | `src/app/services/inscricao.service.ts` |

**Estrutura de apoio:** `src/app/pages/` (lista, formulário, detalhes e página não encontrada) e `src/app/app.routes.ts` (rotas de lista, cadastro, consulta, edição e 404).

## Conflitos encontrados e decisões

| Conflito | Fontes | Decisão | Motivo |
| --- | --- | --- | --- |
| Data da prova: 13/03/2027 ou 14/03/2027 | Áudio × regulamento oficial | Usar **14/03/2027** | O regulamento oficial prevalece sobre a fala no áudio |
| Classificar pelo ano de nascimento ou pela idade completa | Mensagem do grupo × art. 6º | Usar a **idade completa na data da prova** | O art. 6º define o critério oficial; o ano de nascimento causaria erros perto do aniversário |
| Inscrever uma família inteira com um único e-mail | Sugestão do cliente × inscrição individual e regra de um e-mail por inscrição | Exigir **um e-mail distinto por participante** | A inscrição é individual e o e-mail é o identificador único |
| Tratar e-mails do Gmail com pontos como equivalentes | Exemplo do cliente × regra geral de e-mail | Normalizar **apenas espaços externos e caixa**; pontos e `+` não são alterados | O exemplo não define regra geral de equivalência entre provedores |
| Confirmação por e-mail e geração de Pix | Áudio (pedido opcional) × escopo do front-end | **Não implementado** | É explicitamente opcional e exige backend, fora do escopo do teste |

## Perguntas que eu faria ao cliente

| Pergunta | Premissa usada enquanto isso |
| --- | --- |
| Endereços com pontos ou sufixos `+` devem ser tratados como a mesma identidade? Qual regra vale para provedores além do Gmail? | Não há equivalência: só se normalizam espaços externos e caixa |
| Como registrar o contato de menores que ainda não têm e-mail próprio, sem compartilhar o identificador único da inscrição? | Mantêm-se os quatro campos obrigatórios, sem dados de responsável |
| Em uma evolução com backend, qual política de guarda e compartilhamento dos dados pessoais dos participantes deve ser aplicada? | Os dados ficam apenas no `localStorage` do próprio navegador |

## Fora de escopo

Não foram implementados, conforme o enunciado e a delimitação do teste:

- **Backend e banco de dados:** a persistência é apenas local ao navegador.
- **Autenticação e autorização de responsáveis:** não há contas nem perfis.
- **Envio de e-mail e pagamento/Pix:** pedido opcional que depende de backend.
- **Bloqueio por prazo de inscrição ou cancelamento:** não há regra de prazo definida.
- **Sincronização entre abas ou dispositivos:** o `localStorage` é local a cada navegador.

## Verificações realizadas

| Verificação | Resultado |
| --- | --- |
| `npm test -- --watch=false` | 26 testes aprovados |
| `npm run build` | Compilação Angular concluída com sucesso, incluindo bundles de navegador e servidor e pré-renderização das rotas estáticas |

**Casos cobertos pelos testes:**

- **Idade e categorias:** regras de idade em anos completos e de categorias, incluindo as fronteiras (13/14 anos, 17/18, 39/40 e 59/60) e o aniversário no dia da prova.
- **Percurso:** recusa de 10 km para menores de 18 anos.
- **Normalização:** espaços do nome e espaços/caixa do e-mail.
- **Serviço:** cadastro, e-mail duplicado recusado, edição (com e-mail e posição preservados), edição recusada com dados inválidos e cancelamento com liberação do e-mail.
- **Rotas e telas:** consulta, edição e página não encontrada.
