# Sistema para Distribuidora de Bebidas — Documentação e Plano de Trabalho

## Credenciais de acesso (ambiente de desenvolvimento)

- **Administrador:** usuário `admin` / senha `admin123`
- **Operador de Caixa:** usuário `caixa` / senha `caixa123`

> O seed inicial cria **apenas os usuários** `admin` e `caixa`. Produtos e categorias devem ser cadastrados pelo painel. Para zerar o banco: `npm run db:reset`.

---

## 1. Estrutura das telas

- **/login** — Tela de login (usuário/senha), redireciona conforme perfil.
- **/ (Dashboard)** — Visão geral: vendas do dia, faturamento do mês, produtos ativos, alertas de estoque mínimo, acesso rápido.
- **/vendas** — PDV (Ponto de Venda): busca por código de barras (leitor USB), carrinho, quantidade, desconto, formas de pagamento, finalizar/cancelar venda.
- **/produtos** *(admin)* — CRUD de produtos: nome, código de barras, categoria, marca, custo, preço, estoque, estoque mínimo.
- **/categorias** *(admin)* — CRUD de categorias.
- **/marcas** *(admin)* — CRUD de marcas.
- **/estoque** *(admin)* — Movimentações de estoque (entrada, saída, ajuste) e histórico.
- **/relatorios** *(admin)* — Relatórios diários/semanais/mensais de vendas, estoque, lucro estimado, formas de pagamento. Exportação em PDF/Excel.
- **/usuarios** *(admin)* — CRUD de usuários (admin/operador de caixa).
- **/auditoria** *(admin)* — Histórico de ações sensíveis (login, cancelamento de vendas, ajustes de estoque etc.).
- **/backup** *(admin)* — Geração de backup do banco (.db) e restauração.
- **/pagamentos** *(admin)* — Documentação da API de integração com máquina de cartão.

Layout: barra lateral fixa com navegação (visível apenas conforme perfil), cabeçalho com usuário logado/logout, área de conteúdo principal.

---

## 2. Estrutura do banco de dados (Prisma Schema)

Já criada em `prisma/schema.prisma`, usando SQLite (arquivo `prisma/dev.db`) através do adapter `@prisma/adapter-better-sqlite3`, preparado para troca futura para PostgreSQL (basta alterar o `datasource` e o adapter).

Modelos principais:
- **User** — usuários (admin/caixa), senha com hash (bcrypt).
- **Category / Brand** — categorias e marcas de produtos.
- **Product** — produtos com código de barras, custo, preço, estoque atual e mínimo.
- **StockMovement** — histórico de entrada/saída/ajuste/venda de estoque.
- **Sale / SaleItem / Payment** — vendas, itens vendidos e formas de pagamento (dinheiro, PIX, débito, crédito — apenas registro).
- **AuditLog** — auditoria de ações (login/logout, cancelamento de venda, ajustes etc.).
- **BackupLog** — histórico de backups/restaurações realizados.

---

## 3. Etapas de desenvolvimento

- [x] **Etapa 0 — Base do projeto:** Next.js + TypeScript + Tailwind + shadcn/ui, Prisma + SQLite configurado, schema do banco criado e migrado, seed inicial (usuários, categorias, marcas, produtos de exemplo).
- [x] **Etapa 1 — Autenticação:** login com sessão via cookie assinado (JWT), middleware de proteção de rotas por perfil (admin/caixa), logout, tela de login estilizada.
- [x] **Etapa 2 — Layout principal:** sidebar dinâmica por perfil, cabeçalho com usuário, dashboard inicial com indicadores.
- [x] **Etapa 3 — Cadastro de Produtos e Categorias:** CRUD completo com validações (Zod), tabela com busca/filtro, formulários shadcn/ui.
- [x] **Etapa 4 — Estoque:** entrada, saída, ajuste manual, histórico de movimentações, alerta visual de estoque mínimo.
- [x] **Etapa 5 — Tela de Vendas (PDV):** leitura via leitor USB (input de código de barras com foco automático), carrinho, quantidade, desconto, múltiplas formas de pagamento, finalização com baixa automática de estoque.
- [x] **Etapa 6 — Cancelamento de venda:** com motivo obrigatório, reposição de estoque e registro em auditoria.
- [x] **Etapa 7 — Relatórios:** vendas diárias/semanais/mensais, estoque, lucro estimado, formas de pagamento — com tabelas.
- [x] **Etapa 8 — Exportação:** PDF (jspdf/jspdf-autotable) e Excel (exceljs) dos relatórios.
- [x] **Etapa 9 — Gestão de usuários:** CRUD de usuários (somente admin), ativar/inativar, com proteção contra remover o próprio usuário ou o último admin ativo.
- [x] **Etapa 10 — Auditoria:** tela de consulta de logs de ações sensíveis, com busca por texto.
- [x] **Etapa 11 — Backup e Restauração:** exportar/importar arquivo do banco SQLite pela interface.
- [x] **Etapa 12 — Polimento final:** responsividade, atalhos de teclado no PDV, integrações de pagamento, suporte WhatsApp.

### Detalhes da Etapa 12

- [x] **Responsividade:** sidebar colapsável com menu hamburger em telas pequenas (`AppShell` + drawer mobile).
- [x] **Atalhos de teclado no PDV:** `F8` foco na busca, `F2` finalizar venda, `F4` limpar carrinho, `F3` consultar estoque.
- [x] **Identidade visual:** favicon e metadados atualizados para "Adega Faixa Rosa".
- [x] **Integração Mercado Pago Point:** Orders API + webhook + liberação manual.
- [x] **Suporte WhatsApp:** botão flutuante (?) em todas as telas.
- [ ] **Testes automatizados:** pendente (fluxo login → venda → cancelamento).
- [ ] **Merge na `main`:** código ainda na branch `cursor/fase-final-polimento-6f4f` (PR #3).

---

## 4. API da máquina de cartão

### Mercado Pago Point (recomendado)

Configure no `.env`:

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_TERMINAL_ID=NEWLAND_N950__SERIAL
MERCADOPAGO_WEBHOOK_SECRET=...
```

Webhook: `POST /api/pagamentos/mercadopago/webhook` — evento **Order** no painel Mercado Pago.

No PDV, marque **"Cobrar na Mercado Pago Point"** — o sistema cria a order na API e a maquininha carrega automaticamente.

Documentação completa em **`/pagamentos`**.

### API genérica (fallback)

Porta: mesma do servidor Next.js (padrão **3000**). Autenticação via header `X-Terminal-Key` (variável `TERMINAL_API_KEY` no `.env`).

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/pagamentos/terminal/consulta?ref=XXXX` | GET | Consulta venda pendente pelo código exibido no PDV |
| `/api/pagamentos/terminal/callback` | POST | Máquina confirma pagamento (`status: APPROVED`) e libera a venda |

> **Nota:** o cadastro de Marcas (Etapa 3) não foi implementado como entidade separada — a categorização de produtos ficou centralizada em Categorias.

Cada etapa será desenvolvida e apresentada para revisão antes de avançar para a próxima.
