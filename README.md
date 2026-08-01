# Adega Faixa Rosa — Sistema PDV

Sistema de gestão e ponto de venda para distribuidora de bebidas.

## Início rápido

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Acesse http://localhost:3000

| Usuário | Senha | Perfil |
|---------|-------|--------|
| `admin` | `admin123` | Administrador |
| `caixa` | `caixa123` | Caixa |

> Troque as senhas antes de usar na loja. Banco inicia **limpo** (sem produtos).

## Funcionalidades

- PDV com leitor de código de barras, autocomplete e atalhos (F2/F3/F4/F8)
- Produtos, categorias, estoque, relatórios (PDF/Excel)
- Usuários, auditoria, backup/restauração SQLite
- Maquininhas: **Mercado Pago Point**, **SumUp**, **Ton (Stone)** ou **API genérica**
- Suporte WhatsApp (botão ? flutuante)

## Maquininhas (configurar depois)

Admin → **Pagamentos** → escolha a maquininha e cole as credenciais quando tiver.

Não precisa de API no primeiro dia: use **dinheiro/PIX** ou **liberação manual** no PDV.

Documentação completa: `SISTEMA.md`

## Comandos

```bash
npm run dev          # servidor desenvolvimento
npm run db:reset     # zera produtos/vendas, mantém usuários
npm run lint         # ESLint
npm run typecheck    # TypeScript
```

## Suporte

WhatsApp: (64) 99290-3947
