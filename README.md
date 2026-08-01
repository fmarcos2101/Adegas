# Distribuidora de Bebidas — Sistema de PDV e Gestão

Sistema web para distribuidora de bebidas: autenticação por perfil, dashboard,
cadastro de produtos/categorias, controle de estoque, PDV (ponto de venda) com
leitura por código de barras e baixa automática de estoque, auditoria e (em
evolução) relatórios/backup. As telas e etapas estão descritas em
[`SISTEMA.md`](SISTEMA.md).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** com **SQLite** (adapter `@prisma/adapter-better-sqlite3`)
- Autenticação: sessão JWT em cookie (`jose`) + `bcryptjs`

## Como rodar (desenvolvimento)

```bash
npm install            # instala deps e gera o Prisma Client (postinstall)
npx prisma db push     # cria o banco SQLite (prisma/dev.db) a partir do schema
npm run db:seed        # popula usuários, categorias e produtos de exemplo
npm run dev            # http://localhost:3000
```

### Credenciais de teste (seed)

- Administrador: `admin` / `admin123`
- Operador de Caixa: `caixa` / `caixa123`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e execução de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm run db:push` | Sincroniza o schema com o banco SQLite |
| `npm run db:seed` | Popula dados de exemplo |

O banco (`prisma/dev.db`) não é versionado; rode `db:push` + `db:seed` após um
checkout limpo.
