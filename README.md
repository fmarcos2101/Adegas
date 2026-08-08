# MAF PDV — PDV Online (SaaS multi-loja)

Sistema de ponto de venda e gestão com isolamento por cliente (tenant), painel da plataforma para assinaturas e acesso de suporte.

Derivado do PDV da Adega Faixa Rosa, com identidade genérica para exposição online.

## Início rápido

**Node.js recomendado: 22 LTS** ([nodejs.org](https://nodejs.org)). Evite Node 24 em PCs de loja no Windows.

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Acesse http://localhost:3000 — landing pública. Cadastro em `/cadastro`, login em `/login`.

| Acesso | Código da loja | Usuário | Senha |
|--------|----------------|---------|-------|
| Plataforma (dono) | *(deixe em branco)* | `owner` | `owner123` |
| Loja demo (admin) | `demo` | `admin` | `admin123` |
| Loja demo (caixa) | `demo` | `caixa` | `caixa123` |

## Instalação no Windows (PC da loja)

1. Extraia o projeto para uma pasta **fora do OneDrive** (ex.: `C:\NexoPDV`).
2. Instale o **Node.js 22 LTS**.
3. Execute `Instalar-NexoPDV.bat` (duplo clique).
4. Depois use `Iniciar-NexoPDV.bat`.

Se `npm install` falhar com `confbox` / `rolldown-runtime`, ou o build falhar com  
`next-swc.win32-x64-msvc.node não é um aplicativo Win32 válido` / Turbopack:

1. Delete a pasta `node_modules` e `.next`
2. No Prompt, dentro da pasta do sistema:
   ```bat
   npm cache clean --force
   ```
3. Execute `Reparar-NexoPDV.bat` (ou `Instalar-NexoPDV.bat` de novo)

O script `build` usa Webpack (`next build --webpack`) para não depender do Turbopack nativo no Windows quando o binário SWC vem corrompido.

## O que é

- **Landing + auto-cadastro** — visitante cria a loja, inicia trial e entra no painel
- **Cada loja** tem produtos, estoque, vendas e usuários isolados (`/dashboard`, `/pdv`)
- **Painel `/plataforma`** — criar clientes, planos, status de assinatura, uso (vendas/mês) e **entrar como suporte**
- **Cobrança automática** via Mercado Pago Assinaturas (`/plataforma/cobranca`)
- Assinaturas: **7 dias de teste grátis**, depois Básico (1 PDV) / Plus·Pro (até 3 PDVs)
- Após o trial, admin é levado a `/assinatura`; caixa fica bloqueado até assinar
- Owner pode resetar senha e gerenciar usuários de qualquer loja em `/plataforma/lojas/[id]`

## Cobrança Mercado Pago (SaaS)

1. Login como `owner` → **Cobrança Mercado Pago**
2. Cole o Access Token da sua conta MP e salve os preços
3. No painel do MP, cadastre o webhook apontando para  
   `https://SEU_DOMINIO/api/assinaturas/mercadopago/webhook`  
   (tópicos: `subscription_preapproval` e `subscription_authorized_payment`)
4. Em cada loja → **Gerar link de cobrança** (e-mail do cliente + plano)
5. Cliente autoriza o cartão; as mensalidades passam a ser cobradas sozinhas

Alternativa via `.env`: `PLATFORM_MP_ACCESS_TOKEN` e `PLATFORM_MP_WEBHOOK_SECRET`.

## Funcionalidades da loja

- PDV com leitor, autocomplete e atalhos
- Produtos, categorias, estoque, relatórios (PDF/Excel)
- Usuários, auditoria, backup SQLite
- Maquininhas: Mercado Pago Point, SumUp, Ton ou API genérica

## Comandos

```bash
npm run dev          # desenvolvimento
npm run db:reset     # zera produtos/vendas da demo
npm run lint
npm run typecheck
```

## Documentação

Veja `SISTEMA.md` para telas, papéis e modelo de dados.

## Suporte WhatsApp (opcional)

Defina `NEXT_PUBLIC_SUPPORT_WHATSAPP` (ex.: `5564999999999`) no `.env` para exibir o botão flutuante.
