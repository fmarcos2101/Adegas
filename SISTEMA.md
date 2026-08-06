# NexoPDV — Documentação do sistema SaaS

## Credenciais (desenvolvimento)

| Acesso | Código da loja | Usuário | Senha |
|--------|----------------|---------|-------|
| Dono da plataforma | *(vazio)* | `owner` | `owner123` |
| Admin da loja demo | `demo` | `admin` | `admin123` |
| Caixa da loja demo | `demo` | `caixa` | `caixa123` |

> O seed cria a loja `demo` (trial 14 dias), usuários da loja e o super-admin `owner`. Use `npm run db:reset` para zerar produtos/vendas.

---

## 1. Telas

### Plataforma (super-admin)

- **/plataforma** — lista de clientes, MRR estimado, uso do mês, formulário de nova loja
- **/plataforma/lojas/[id]** — detalhe do cliente, assinatura (plano/status/valor), usuários, **Entrar como suporte**

### Loja (tenant)

- **/login** — código da loja + usuário + senha
- **/ (Dashboard)** — vendas do dia, faturamento, produtos, alertas de estoque
- **/pdv** — PDV tela cheia
- **/produtos**, **/categorias**, **/estoque**, **/relatorios**, **/pagamentos**, **/usuarios**, **/auditoria**, **/backup**

---

## 2. Multi-tenancy e assinatura

Modelos novos:

- **Tenant** — loja/cliente (`name`, `slug` único usado no login, `active`)
- **Subscription** — `plan` (TRIAL/BASIC/PRO), `status` (TRIALING/ACTIVE/PAST_DUE/SUSPENDED/CANCELLED), `priceMonthly`, períodos
- Dados de negócio (`User`, `Product`, `Category`, `Sale`, `StockMovement`, `PaymentSettings`, `AuditLog`) carregam `tenantId`

Login bloqueia lojas inativas ou com assinatura SUSPENDED/CANCELLED.

O dono da plataforma pode entrar em qualquer loja em **modo suporte** (papel ADMIN na loja) e voltar ao painel.

---

## 3. Papéis

- **SUPER (isPlatformAdmin)** — `/plataforma`; pode suporte em lojas
- **ADMIN da loja** — painel completo da própria loja
- **CAIXA** — `/pdv` e `/estoque` (só ENTRADA)

---

## 4. Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + Prisma 7 (SQLite). Proteção de rotas em `src/proxy.ts`.

---

## 5. Identidade

Produto genérico **NexoPDV** (sem marca de loja específica). Cores teal/slate. WhatsApp de suporte via `NEXT_PUBLIC_SUPPORT_WHATSAPP`.
