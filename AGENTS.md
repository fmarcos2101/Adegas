<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Sistema de PDV/gestão multi-loja (**MAF PDV** SaaS). Stack: **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind v4 + Prisma 7 (SQLite via `@prisma/adapter-better-sqlite3`)**. Código em `src/` (alias `@/*` → `./src/*`). Scripts em `package.json`; telas em `SISTEMA.md`.

### Primeira execução (banco não é versionado)
`prisma/dev.db` está no `.gitignore`. Após checkout limpo:

```
npx prisma db push
npm run db:seed
```

Credenciais: plataforma `owner`/`owner123` (código da loja em branco); loja `demo` + `admin`/`admin123` ou `caixa`/`caixa123`.

### Rodar / verificar
- Dev: `npm run dev` (porta 3000). Painel SaaS: `/plataforma`.
- Lint: `npm run lint` · Type-check: `npm run typecheck`.

### Papéis e rotas
- **Plataforma** (`isPlatformAdmin`): `/plataforma` — clientes, assinaturas, uso; pode entrar em loja no modo suporte.
- **PDV** `/pdv` — tela cheia; dados isolados por `tenantId`.
- **CAIXA**: `/pdv` e `/estoque` (só ENTRADA). Demais rotas da loja são ADMIN.
- Produtos sem código: prefixo `SEM-` (`src/lib/constants.ts`).

### Gotchas
- Proxy Next 16: `src/proxy.ts` (`export function proxy`).
- Prisma 7: URL em `prisma.config.ts`; adapter em `src/lib/prisma.ts`.
- Tailwind v4: `@import "tailwindcss"` em `globals.css`.
- ESLint 9 flat: `eslint.config.mjs`.
- Login exige **código da loja** (slug), exceto super-admin.
- **Trial de 7 dias** (`TRIAL_DAYS` em `src/lib/trial.ts`): loja nova começa em TRIALING; ao expirar vira PAST_DUE e admin só acessa `/assinatura`.
- Após mudar schema: `npx prisma generate` e reinicie o dev server.
