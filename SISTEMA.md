# MAF PDV — Documentação do sistema SaaS

## Credenciais (desenvolvimento)

| Acesso | Código da loja | Usuário | Senha |
|--------|----------------|---------|-------|
| Dono da plataforma | *(vazio)* | `owner` | `owner123` |
| Admin da loja demo | `demo` | `admin` | `admin123` |
| Caixa da loja demo | `demo` | `caixa` | `caixa123` |

> O seed cria a loja `demo` (trial 14 dias), usuários da loja e o super-admin `owner`. Use `npm run db:reset` para zerar produtos/vendas.

---

## 1. Telas (3 superfícies)

### Visitante (público)

- **/** — landing MAF PDV (apresentação, planos, CTA)
- **/cadastro** — auto-cadastro: cria loja + admin, inicia trial de 7 dias e já entra no painel
- Landing: seção **Falar com especialistas** (nome, WhatsApp, CPF, e-mail) → leads em `/plataforma/leads`
- **/login** — código da loja + usuário + senha (código vazio = dono da plataforma)

### Plataforma (super-admin — você)

- **/plataforma** — KPIs, filas de atenção (atrasadas / trial acabando / suspensas), busca e filtros de clientes, suspender/reativar, criar loja
- **/plataforma/cobranca** — Access Token Mercado Pago, preços Básico/Pro, URL do webhook
- **/plataforma/atividade** — auditoria das ações do dono (suporte, suspensões, checkouts…)
- **/plataforma/lojas/[id]** — perfil/notas internas, assinatura, **gerar/copiar link MP**, usuários (criar/resetar/**excluir**), **Entrar como suporte**, **apagar conta** (zona de perigo)
- **Cancelar assinatura** → bloqueia acesso, **mantém** dados da loja
- **Apagar conta** (só owner) → remove a loja e **todo** o banco dela (cascade)
- **/assinatura** (admin da loja) — plano, checkout Mercado Pago e histórico de cobranças
- Webhook: `POST /api/assinaturas/mercadopago/webhook` (tópicos `subscription_preapproval` e `subscription_authorized_payment`)

### Loja (tenant)

- **/dashboard** — vendas do dia, faturamento, produtos, alertas de estoque
- **/pdv** — PDV tela cheia
- **/produtos**, **/categorias**, **/estoque**, **/relatorios**, **/pagamentos**, **/usuarios**, **/auditoria**, **/backup**

---

## 2. Multi-tenancy e assinatura

Modelos novos:

- **Tenant** — loja/cliente (`name`, `slug` único usado no login, `active`)
- **Subscription** — `plan` (TRIAL/BASIC/PRO), `status` (TRIALING/ACTIVE/PAST_DUE/SUSPENDED/CANCELLED), `priceMonthly`, períodos
- Dados de negócio (`User`, `Product`, `Category`, `Sale`, `StockMovement`, `PaymentSettings`, `AuditLog`) carregam `tenantId`

Login bloqueia lojas inativas ou com assinatura SUSPENDED/CANCELLED.

**Teste grátis:** toda loja nova ganha **7 dias** (`TRIALING` + `trialEndsAt`). Banner no painel mostra os dias restantes. Ao expirar, vira `PAST_DUE`: caixa é bloqueado; admin só acessa `/assinatura` para assinar. No checkout Mercado Pago, o trial restante é enviado como `free_trial` (1ª cobrança depois do teste).

**Limite de PDVs:** cada usuário **Caixa** ativo = 1 PDV. Admin não consome vaga.
- Trial / Básico → **1 PDV**
- Plus / Pro → **até 3 PDVs**

**Suporte (owner):** em `/plataforma/lojas/[id]` pode criar usuário, ativar/inativar e **resetar senha**.

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

**MAF PDV** — tipografia Orbitron + Archivo, paleta chrome metálico / preto / fumaça. Logo em `public/logo-maf.png`. WhatsApp de suporte via `NEXT_PUBLIC_SUPPORT_WHATSAPP`.

## 6. Auto-cadastro

`/cadastro` cria `Tenant` + `Subscription` (TRIALING) + usuário ADMIN via `src/lib/create-tenant.ts` (mesmo fluxo usado pelo painel `/plataforma`). Após o cadastro, a sessão é aberta e o usuário vai para `/dashboard`. O pagamento da assinatura fica em `/assinatura` (Mercado Pago), durante ou após o trial.
