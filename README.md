# HiveApp

O HiveApp é um sistema de gerenciamento para condomínios, com foco em reduzir os conflitos entre moradores e a administração do prédio. O sistema oferece funcionalidades para gerenciamento de acesso, reservas de áreas comuns, notificações, encomendas, boletos e chamados de manutenção.

## Setup para desenvolvimento e testes

Com o Docker Desktop em execução, use:

```bash
yarn setup
```

O comando:

1. inicia PostgreSQL, pgAdmin e MinIO;
2. garante a existência do banco de cada microsserviço;
3. sincroniza todos os schemas pelo Drizzle;
4. limpa e popula autenticação, cadastro, comunicação, reservas, encomendas, visitantes, arquivos e manutenção;
5. envia quatro boletos e dois anexos de manutenção de demonstração para o MinIO;
6. valida automaticamente a quantidade de registros criada em cada serviço.

O setup é repetível, mas substitui os dados locais das tabelas dos serviços. Para também remover os volumes e reconstruir todo o ambiente do zero:

```bash
yarn setup:reset
```

Para usar uma infraestrutura que já esteja ativa:

```bash
yarn setup --skip-infra
```

### Cenário de demonstração

O setup cria dois condomínios independentes. Cada um possui duas residências, um morador por residência, um funcionário com permissões operacionais e um administrador.

| Condomínio        | Residência       | Perfil         | E-mail                 | Finalidade                                      |
| ----------------- | ---------------- | -------------- | ---------------------- | ----------------------------------------------- |
| Jardim das Flores | Apartamento 101A | Morador        | `joao@example.com`     | Dados e operações da própria residência         |
| Jardim das Flores | Apartamento 102A | Moradora       | `maria@example.com`    | Dados e operações da própria residência         |
| Jardim das Flores | —                | Funcionária    | `ana@example.com`      | Visualização e operação dos dados do condomínio |
| Jardim das Flores | —                | Administradora | `fernanda@example.com` | Administração completa do condomínio            |
| Bosque Verde      | Casa 01          | Morador        | `carlos@example.com`   | Dados e operações da própria residência         |
| Bosque Verde      | Casa 02          | Moradora       | `beatriz@example.com`  | Dados e operações da própria residência         |
| Bosque Verde      | —                | Funcionário    | `rafael@example.com`   | Visualização e operação dos dados do condomínio |
| Bosque Verde      | —                | Administradora | `luciana@example.com`  | Administração completa do condomínio            |

A senha padrão é `hive123`. Ela pode ser alterada somente para a população executada:

```powershell
$env:HIVE_SEED_PASSWORD = "outra-senha"
yarn setup
```

Após o setup, inicie todas as APIs, o event-bus e o front-end com:

```bash
yarn start
```

O comando aguarda todas as aplicações ficarem disponíveis, mostra seus endereços e mantém os processos agrupados. Pressione `Ctrl+C` para encerrar tudo.

Para reiniciar automaticamente as APIs quando o código mudar, use `yarn start --watch`. Se a porta padrão do front já estiver ocupada, escolha outra com `yarn start --front-port=5174`.

Para iniciar somente um workspace, use:

```bash
yarn workspace <nome-do-servico> start:watch
```

## 👤 Integrantes

| Nome                                  | RA         |
| ------------------------------------- | ---------- |
| Alan Martins                          | 23.01552-7 |
| Diogo Musso Coutinho                  | 23.01099-0 |
| Gabriel Coutinho                      | 22.95007-9 |
| Gustavo Gomes                         | 23.01268-4 |
| Lucas Mammoccio Gomes Martins Calçada | 23.01372-9 |
| Vinicius Takashi                      | 23.01037-0 |
