# 01 — Visão Geral

## 1.1 Objetivo do sistema

O **Claudim** é um sistema de gestão (ERP focado) para **distribuidoras de bebidas**.
Seu objetivo é apoiar as operações do dia a dia — compra, armazenagem, venda,
faturamento, entrega e cobrança — reduzindo erros manuais, dando visibilidade
de estoque e financeiro, e acelerando o ciclo pedido → entrega → recebimento.

## 1.2 Problema de negócio

Distribuidoras de bebidas operam com:

- **Alto volume de SKUs** (marcas, tamanhos, embalagens, retornáveis/descartáveis).
- **Giro rápido** e sazonalidade forte (verão, feriados, eventos).
- **Vendas B2B** (bares, restaurantes, mercados) com tabelas de preço e prazos
  diferenciados por cliente.
- **Logística própria** com rotas, veículos e conferência de carga/descarga.
- **Controle fiscal** (NF-e, impostos, ST — substituição tributária) e financeiro
  (contas a pagar/receber, inadimplência).

O sistema centraliza esses processos numa única fonte de verdade.

## 1.3 Escopo

### Dentro do escopo (MVP + evoluções planejadas)

1. **Cadastros base**: produtos, categorias, marcas, unidades, clientes,
   fornecedores, transportadoras, usuários.
2. **Estoque**: entradas, saídas, ajustes, inventário, controle por lote/validade,
   múltiplos depósitos.
3. **Vendas / Pedidos**: pedido de venda, tabelas de preço, descontos, reservas
   de estoque, status do pedido.
4. **Faturamento**: geração de fatura/nota, integração fiscal (NF-e) prevista.
5. **Financeiro**: contas a receber e a pagar, baixa de títulos, fluxo de caixa,
   inadimplência.
6. **Logística / Entregas**: separação, romaneio, rotas, confirmação de entrega.
7. **Relatórios e BI**: vendas por período/cliente/produto, curva ABC, ruptura de
   estoque, DRE gerencial simplificado.
8. **Segurança**: autenticação, perfis de acesso e trilha de auditoria.

### Fora do escopo (nesta primeira versão)

- Emissão fiscal certificada ponta a ponta (será integrada via provedor/fase
  posterior; o modelo já prevê os campos).
- Aplicativo mobile nativo para vendedor externo (previsto como evolução; a API
  será construída de forma a suportá-lo).
- Integrações com marketplaces/e-commerce B2C.
- Roteirização otimizada automática (entra como evolução; inicialmente rota manual).

## 1.4 Público-alvo (perfis de usuário)

| Perfil | Responsabilidades principais |
|--------|------------------------------|
| **Administrador** | Configuração do sistema, usuários, permissões, parâmetros |
| **Vendedor / Balconista** | Criação de pedidos, consulta de preços e estoque |
| **Estoquista** | Entradas, conferência, inventário, separação |
| **Financeiro** | Contas a pagar/receber, baixas, cobrança |
| **Faturista** | Emissão de faturas/notas |
| **Motorista / Entregador** | Consulta de rota e confirmação de entrega |
| **Gestor** | Relatórios, indicadores e acompanhamento |

## 1.5 Indicadores de sucesso

- Tempo médio de criação de um pedido reduzido (fluxo em poucos cliques).
- Divergência de inventário abaixo de um limite aceitável (ex.: < 1%).
- Visibilidade de ruptura de estoque em tempo real.
- Redução de inadimplência via controle ativo de contas a receber.

## 1.6 Glossário

| Termo | Significado |
|-------|-------------|
| **SKU** | Unidade de manutenção de estoque (produto identificável e vendável) |
| **NF-e** | Nota Fiscal Eletrônica |
| **ST** | Substituição Tributária (regime de ICMS) |
| **Romaneio** | Documento que relaciona os itens de uma carga/entrega |
| **Curva ABC** | Classificação de itens por relevância (faturamento/giro) |
| **Ruptura** | Falta de produto disponível para venda |
| **Retornável** | Embalagem que retorna (ex.: garrafa de vidro, casco) |
| **Casco / Vasilhame** | Embalagem retornável controlada à parte do conteúdo |
| **Título** | Documento financeiro a pagar ou a receber (duplicata) |
