<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Sistema de PDV/gestão para distribuidora de bebidas. Stack: **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind v4 + Prisma 7 (SQLite via `@prisma/adapter-better-sqlite3`)**. Código em `src/` (alias `@/*` → `./src/*`). Scripts padrão em `package.json`; comandos e telas descritos em `SISTEMA.md`.

### Primeira execução (banco não é versionado)
`prisma/dev.db` está no `.gitignore`, então após um checkout limpo o banco não existe. O update script roda `npm install` (que dispara `prisma generate` via `postinstall`), mas **NÃO** cria nem popula o banco. Antes de rodar o app pela primeira vez:

```
npx prisma db push   # cria prisma/dev.db a partir do schema
npm run db:seed      # cria usuários/categorias/produtos de exemplo
```

Credenciais de teste criadas pelo seed: `admin`/`admin123` (perfil ADMIN) e `caixa`/`caixa123` (perfil CAIXA). O seed é idempotente (usa `upsert`).

### Rodar / verificar
- Dev server: `npm run dev` (porta 3000). O root `/` redireciona para `/login` quando não autenticado.
- Lint: `npm run lint` · Type-check: `npm run typecheck`.
- Fluxo end-to-end: login como `admin` → Dashboard → Produtos (cadastrar) → PDV (`/pdv`, adicionar por código/iniciais → Finalizar venda) → Dashboard reflete a venda.

### Papéis e rotas
- **PDV** fica em `/pdv` — tela dedicada em tela cheia (layout próprio, sem sidebar), pensada para abrir em nova aba e ficar em segundo plano. A busca aceita código de barras (leitor), código ou iniciais do nome (autocomplete com estoque), e há um painel "Consultar estoque" para revisar sem sair do PDV.
- **Perfil CAIXA**: acessa apenas `/pdv` e `/estoque`; no estoque só pode **ENTRADA** (saída/ajuste são bloqueados na UI e no server action). As demais rotas (incl. `/` e `/produtos`, `/relatorios`, `/usuarios`, etc.) são exclusivas de ADMIN e o Proxy redireciona o caixa para `/pdv`.
- Produtos podem ser cadastrados **sem código de barras** (checkbox): o backend gera um código interno com prefixo `SEM-` (ver `src/lib/constants.ts`), exibido como "sem código" nas listagens.

### Gotchas não óbvios (específicos destas versões)
- **Middleware virou Proxy** no Next 16: exporta `export function proxy(req)` (não `middleware`). Como o app fica em `src/`, o arquivo precisa estar em **`src/proxy.ts`** (mesmo nível de `src/app`) — em `proxy.ts` na raiz ele é ignorado. É onde fica a proteção de rotas por perfil.
- **Prisma 7**: o `datasource` no `schema.prisma` NÃO aceita mais `url`. A URL fica em `prisma.config.ts` (campo `datasource.url`, exigido por `prisma db push`/`migrate`). Em runtime, o `PrismaClient` recebe o adapter (`new PrismaBetterSqlite3({ url })`) — veja `src/lib/prisma.ts`. O adapter usa `defaultSafeIntegers`, mas o Prisma converte colunas `Int` para `number` normalmente.
- **Tailwind v4**: sem `tailwind.config`; o CSS usa `@import "tailwindcss"` em `src/app/globals.css` e o plugin `@tailwindcss/postcss` em `postcss.config.mjs`.
- **ESLint 9 flat config**: `eslint.config.mjs` importa os arrays de `eslint-config-next/core-web-vitals` e `eslint-config-next/typescript` (não use `.eslintrc`).
- Reinstalar dependências não recarrega o dev server automaticamente para mudanças no Prisma Client — rode `npx prisma generate` e reinicie `npm run dev` após alterar `schema.prisma`.
