# Maintenance Service

Microsserviço de chamados de manutenção do HiveApp. Ele mantém seu próprio banco e não chama
outros serviços diretamente. Anexos chegam por meio do evento `FILE_STORED`, publicado pelo
`file-service` no barramento já existente.

## Fluxo principal

1. Um usuário autenticado cria um chamado em `POST /tickets`.
2. A administração faz a triagem e pode atribuir um responsável.
3. O responsável inicia e resolve o chamado.
4. Um usuário com permissão de fechamento confirma o encerramento.
5. Fotos e documentos são enviados diretamente ao `file-service`, informando o `ticketId` em
   `ownerId`. O evento `FILE_STORED` associa o arquivo ao chamado.

## Rotas

- `POST /tickets`: cria um chamado.
- `GET /tickets`: lista chamados acessíveis; aceita o filtro `status`.
- `GET /tickets/:ticketId`: detalha chamado, comentários, anexos e histórico.
- `POST /tickets/:ticketId/comments`: adiciona comentário público ou interno.
- `POST /tickets/:ticketId/triage`: define prioridade e prazo.
- `POST /tickets/:ticketId/assign`: atribui o chamado.
- `POST /tickets/:ticketId/start`: inicia o atendimento.
- `POST /tickets/:ticketId/wait`: registra espera por morador, fornecedor ou material.
- `POST /tickets/:ticketId/resolve`: registra a solução.
- `POST /tickets/:ticketId/close`: encerra um chamado resolvido.
- `POST /tickets/:ticketId/reopen`: reabre um chamado.
- `POST /tickets/:ticketId/cancel`: cancela um chamado ainda não iniciado.
- `POST /tickets/:ticketId/reject`: rejeita um chamado durante a triagem.

## Permissões

- `@maintenance:ticket:view:building`
- `@maintenance:ticket:view:residency`
- `@maintenance:ticket:triage`
- `@maintenance:ticket:work`
- `@maintenance:ticket:close`
- `@maintenance:ticket:comment:internal`

`@core:admin` concede todas as permissões acima. Qualquer usuário autenticado com vínculo a uma
unidade pode criar e acompanhar os próprios chamados.

Para baixar anexos, moradores também precisam de `@file:view:residency`; profissionais que atuam
em chamados do condomínio precisam de `@file:view:building`. Essas permissões são verificadas
exclusivamente pelo `file-service`.

## Eventos

Consome:

- `FILE_STORED`: vincula um arquivo do tipo `MAINTENANCE_ATTACHMENT` ao chamado indicado.

Publica:

- `MAINTENANCE_TICKET_CREATED`
- `MAINTENANCE_TICKET_ASSIGNED`
- `MAINTENANCE_TICKET_STATUS_CHANGED`
- `MAINTENANCE_TICKET_RESOLVED`

## Arquivos e responsabilidades

- `README.md`: documenta o contrato, o fluxo e a finalidade de cada arquivo criado.
- `package.json`: scripts e dependências do workspace.
- `tsconfig.json`: compilação TypeScript e aliases de importação.
- `drizzle.config.ts`: configuração de geração e aplicação das migrações.
- `src/config.ts`: porta, banco, JWT e endereços do serviço e do event-bus.
- `src/index.ts`: composição e inicialização do servidor Express.
- `src/db/client.ts`: conexão exclusiva com `maintenanceDb`.
- `src/db/schema/ticket.ts`: tabelas, enums, índices e tipos de chamados.
- `src/helpers/eventBus.ts`: inscrição no `FILE_STORED` e publicação dos eventos do chamado.
- `src/helpers/logger.ts`: formato único de log do serviço.
- `src/helpers/permissions.ts`: permissões e verificação de autorização.
- `src/helpers/routeRegistry.ts`: registro declarativo das rotas HTTP.
- `src/helpers/tickets.ts`: busca, autorização e histórico compartilhados entre casos de uso.
- `src/internal/events.ts`: endpoint interno que consome `FILE_STORED` de forma idempotente.
- `src/middlewares/auth.ts`: valida JWT de usuário e monta o contexto multi-condomínio.
- `src/middlewares/routeWrapper.ts`: aplica autenticação aos handlers públicos.
- `src/middlewares/logger.ts`: registra as requisições recebidas.
- `src/middlewares/error/index.ts`: converte erros de domínio em respostas HTTP.
- `src/middlewares/error/errors/BadRequest.ts`: erro para requisições com dados inválidos.
- `src/middlewares/error/errors/Conflict.ts`: erro para transições de estado inválidas.
- `src/middlewares/error/errors/NotFoundError.ts`: erro para chamados inexistentes no condomínio.
- `src/middlewares/error/errors/Unauthorized.ts`: erro para autenticação ou autorização negada.
- `src/routes/index.ts`: reúne todas as rotas públicas.
- `src/routes/tickets/create/handler.ts`: valida, cria e registra a auditoria inicial do chamado.
- `src/routes/tickets/create/route.ts`: declara a rota `POST /tickets`.
- `src/routes/tickets/view/handler.ts`: lista e detalha chamados conforme o escopo do usuário.
- `src/routes/tickets/view/route.ts`: declara as duas rotas de consulta.
- `src/routes/tickets/comments/handler.ts`: cria comentários públicos ou internos.
- `src/routes/tickets/comments/route.ts`: declara a rota de comentários.
- `src/routes/tickets/actions/handler.ts`: aplica atribuição, triagem e transições de estado.
- `src/routes/tickets/actions/route.ts`: declara as rotas de ação sobre chamados.
- `src/scripts/populate/index.ts`: cria chamados, comentários, histórico e anexo de demonstração.

Arquivos criados no `file-service` para esta integração:

- `src/helpers/eventBus.ts`: publica os metadados de um arquivo armazenado como `FILE_STORED`.
- `src/routes/files/upload/handler.ts`: valida e armazena um anexo individual no MinIO e no
  `fileDb`, sem conhecer as regras internas do chamado.
- `src/routes/files/upload/route.ts`: configura o upload multipart, com limite de um arquivo de
  até 10 MB, e registra `POST /files`.

O `event-bus` não precisou de arquivos ou condicionais novas: seu registro dinâmico já aceita
`FILE_STORED` e os eventos `MAINTENANCE_*`.

## Upload de anexo

O cliente envia `multipart/form-data` diretamente para `POST /files` no `file-service`:

- `file`: JPEG, PNG, WebP ou PDF de até 10 MB;
- `ownerId`: ID do chamado;
- `attachmentType`: `PROBLEM_PHOTO`, `RESOLUTION_PHOTO`, `INVOICE`, `REPORT` ou `OTHER`.

O download continua sendo solicitado diretamente ao `file-service` por
`POST /files/:fileId/download-url`.
