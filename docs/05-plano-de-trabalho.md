# 05 — Plano de Trabalho

O plano é organizado em **fases incrementais**. Cada fase entrega valor utilizável
e é pré-requisito da seguinte. Em vez de estimativas em dias/semanas (que devem ser
definidas pela equipe no planejamento), cada item traz **tamanho relativo**
(P/M/G), **dependências** e **critérios de aceite**.

> Legenda de tamanho: **P** = pequeno, **M** = médio, **G** = grande.

## Fase 0 — Fundação técnica

Objetivo: preparar o esqueleto do projeto e o ambiente de desenvolvimento.

| Item | Tam. | Dependências |
|------|------|--------------|
| Inicializar monorepo (pnpm workspaces), `apps/api` e `apps/web` | M | — |
| Configurar TypeScript, ESLint, Prettier, EditorConfig | P | monorepo |
| `docker-compose.yml` com PostgreSQL para desenvolvimento | P | — |
| Configurar Prisma + primeira migration vazia + `.env.example` | P | Postgres |
| Health check da API (`/health`) e página inicial da web | P | scaffolding |
| Pipeline de CI (GitHub Actions): lint + testes + build | M | scaffolding |
| Autenticação base (login JWT) e RBAC mínimo | G | Prisma |

**Critérios de aceite**: `pnpm install` e `pnpm dev` sobem API e web localmente;
`/health` responde 200; CI verde; login retorna token válido.

## Fase 1 — Cadastros base

Objetivo: gerenciar as entidades fundamentais.

| Item | Tam. | Dependências |
|------|------|--------------|
| CRUD de Produtos (SKU, EAN, unidade, marca, categoria) | G | Fase 0 |
| CRUD de Categorias e Marcas | P | — |
| CRUD de Clientes (PF/PJ, endereços, limite de crédito) | G | Fase 0 |
| CRUD de Fornecedores e Transportadoras | M | Fase 0 |
| Tabelas de preço e preços por produto | M | Produtos |
| Validações (CPF/CNPJ, CEP) e máscaras no frontend | M | CRUDs |
| Seeds de dados de exemplo | P | CRUDs |

**Critérios de aceite**: usuário consegue cadastrar, editar, listar (com paginação
e busca) e inativar cada entidade; validações impedem dados inconsistentes.

## Fase 2 — Estoque

| Item | Tam. | Dependências |
|------|------|--------------|
| Modelo de saldo (`EstoqueSaldo`) e movimentos (`EstoqueMov`) | M | Fase 1 |
| Entrada de estoque (via compra/nota de fornecedor) | M | modelo |
| Ajuste manual com justificativa e auditoria | P | modelo |
| Reserva/saída de estoque (transacional) | G | modelo |
| Múltiplos depósitos | M | modelo |
| Controle de lote/validade | M | modelo |
| Inventário e apuração de divergências | M | modelo |
| Alertas de estoque mínimo/ruptura | P | saldo |

**Critérios de aceite**: cada movimento atualiza o saldo corretamente e é
auditável; disponível = quantidade − reservado nunca fica negativo.

## Fase 3 — Vendas e Pedidos

| Item | Tam. | Dependências |
|------|------|--------------|
| Criação de pedido com itens e cálculo de totais | G | Fases 1–2 |
| Aplicação de tabela de preço e descontos | M | Tabelas de preço |
| Validação de limite de crédito | M | Clientes/Financeiro |
| Ciclo de status do pedido (máquina de estados) | M | pedido |
| Reserva de estoque na confirmação | M | Fase 2 |
| Histórico de pedidos por cliente | P | pedido |

**Critérios de aceite**: pedido confirmado reserva estoque, respeita crédito e
transita corretamente entre status; totais conferem.

## Fase 4 — Faturamento e Financeiro

| Item | Tam. | Dependências |
|------|------|--------------|
| Geração de fatura a partir do pedido | G | Fase 3 |
| Baixa de estoque no faturamento | M | Fases 2–3 |
| Geração de títulos (contas a receber) | M | fatura |
| Contas a pagar (compras/despesas) | M | Fase 2 |
| Baixa de títulos (total/parcial) | M | títulos |
| Fluxo de caixa e relatório de inadimplência | M | financeiro |
| Cancelamento/estorno com reversão consistente | G | fatura/estoque |

**Critérios de aceite**: faturar baixa estoque e gera títulos corretos; estornar
reverte estoque e títulos de forma transacional.

## Fase 5 — Logística e Entregas

| Item | Tam. | Dependências |
|------|------|--------------|
| Romaneio de separação | M | Fase 3 |
| Rotas por veículo/motorista | M | romaneio |
| Confirmação de entrega (recebedor, ocorrência) | M | rotas |
| Devolução/recusa na entrega | M | entrega |
| Controle de retorno de cascos | M | entrega |

**Critérios de aceite**: pedidos separados entram em rota; entrega confirmada
atualiza status do pedido; devoluções refletem no estoque.

## Fase 6 — Relatórios e BI

| Item | Tam. | Dependências |
|------|------|--------------|
| Relatórios de vendas (período/cliente/produto/vendedor) | M | Fases 3–4 |
| Curva ABC | M | vendas |
| Posição de estoque e ruptura | P | Fase 2 |
| Dashboard de KPIs | M | dados |
| Exportação CSV/PDF | P | relatórios |
| DRE gerencial simplificado | M | financeiro |

**Critérios de aceite**: relatórios batem com os dados transacionais; exportações
geram arquivos íntegros.

## Evoluções futuras (backlog)

- Emissão fiscal (NF-e) certificada ponta a ponta.
- App mobile para vendedor externo e para entregador.
- Roteirização automática otimizada.
- Integrações (marketplaces, contabilidade, meios de pagamento).
- Multiempresa/multifilial.

## Estratégia de qualidade e entrega

- **Definition of Done** por item: código + testes automatizados dos fluxos
  críticos + revisão (PR) + CI verde + documentação atualizada.
- **Testes**: unitários nos serviços de domínio; de integração na API; E2E nos
  fluxos principais (login, criar pedido, faturar).
- **Branching**: uma branch por item/feature, PR pequeno e revisado.
- **Versionamento de banco** via migrations; nunca alterar schema manualmente.
- **Ambiente**: cada fase precisa rodar em desenvolvimento com `pnpm dev` e passar
  no CI antes de ser considerada concluída.

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Complexidade fiscal (impostos, ST, NF-e) | Isolar em módulo próprio; integrar provedor externo; modelar campos desde já |
| Consistência de estoque/financeiro | Uso rigoroso de transações e testes de concorrência |
| Escopo crescente (scope creep) | Priorização MoSCoW e entregas por fase |
| Migração/qualidade de dados legados | Rotina de importação validada e seeds de exemplo |
