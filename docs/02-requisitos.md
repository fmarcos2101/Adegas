# 02 — Requisitos

Os requisitos funcionais estão agrupados por módulo e identificados por código
(`RF-<módulo>-<n>`). Cada requisito recebe uma **prioridade** segundo MoSCoW:
**M** (Must), **S** (Should), **C** (Could), **W** (Won't now).

## 2.1 Módulo: Autenticação e Segurança (AUTH)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-AUTH-1 | Login com e-mail e senha, com senha armazenada em hash (bcrypt/argon2) | M |
| RF-AUTH-2 | Perfis de acesso (RBAC) com permissões por módulo e ação | M |
| RF-AUTH-3 | Bloqueio de conta após N tentativas falhas | S |
| RF-AUTH-4 | Trilha de auditoria (quem, o quê, quando) em operações sensíveis | S |
| RF-AUTH-5 | Recuperação de senha por e-mail | S |
| RF-AUTH-6 | Autenticação em dois fatores (2FA) | C |

## 2.2 Módulo: Cadastros (CAD)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-CAD-1 | CRUD de produtos com SKU, código de barras (EAN), unidade, marca, categoria | M |
| RF-CAD-2 | Produto com embalagem (unidade, caixa, fardo) e fator de conversão | M |
| RF-CAD-3 | Controle de retornável/casco vinculado ao produto | S |
| RF-CAD-4 | CRUD de clientes (PF/PJ) com CNPJ/CPF, endereços e limite de crédito | M |
| RF-CAD-5 | CRUD de fornecedores e transportadoras | M |
| RF-CAD-6 | Tabelas de preço por cliente/região/canal | S |
| RF-CAD-7 | Validação de documentos (CPF/CNPJ) e CEP | S |

## 2.3 Módulo: Estoque (EST)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-EST-1 | Entrada de estoque a partir de compra/nota de fornecedor | M |
| RF-EST-2 | Saída de estoque vinculada a pedido/faturamento | M |
| RF-EST-3 | Ajuste manual de estoque com justificativa | M |
| RF-EST-4 | Controle por lote e data de validade | S |
| RF-EST-5 | Múltiplos depósitos/localizações | S |
| RF-EST-6 | Inventário (contagem) com apuração de divergências | S |
| RF-EST-7 | Alerta de estoque mínimo e ruptura | S |
| RF-EST-8 | Reserva de estoque ao confirmar pedido | M |

## 2.4 Módulo: Vendas / Pedidos (VEN)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-VEN-1 | Criar pedido de venda com itens, quantidades e preços | M |
| RF-VEN-2 | Aplicar tabela de preço e descontos (item e pedido) | M |
| RF-VEN-3 | Validar limite de crédito do cliente | S |
| RF-VEN-4 | Ciclo de status do pedido (rascunho → confirmado → separado → faturado → entregue → cancelado) | M |
| RF-VEN-5 | Cálculo automático de totais, impostos previstos e frete | M |
| RF-VEN-6 | Bloquear venda de item sem estoque (configurável) | S |
| RF-VEN-7 | Histórico de pedidos por cliente | S |

## 2.5 Módulo: Faturamento (FAT)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-FAT-1 | Gerar fatura a partir de pedido confirmado | M |
| RF-FAT-2 | Registrar dados fiscais (CFOP, NCM, impostos) na fatura | S |
| RF-FAT-3 | Integração com provedor de NF-e (emissão/consulta) | C |
| RF-FAT-4 | Geração de duplicatas/títulos a receber a partir da fatura | M |
| RF-FAT-5 | Cancelamento/estorno de fatura com regras | S |

## 2.6 Módulo: Financeiro (FIN)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-FIN-1 | Contas a receber com vencimentos e baixa (total/parcial) | M |
| RF-FIN-2 | Contas a pagar (fornecedores, despesas) | M |
| RF-FIN-3 | Fluxo de caixa (previsto x realizado) | S |
| RF-FIN-4 | Relatório de inadimplência e aging | S |
| RF-FIN-5 | Múltiplas formas de pagamento e conciliação | C |

## 2.7 Módulo: Logística / Entregas (LOG)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-LOG-1 | Gerar romaneio de separação a partir de pedidos | M |
| RF-LOG-2 | Agrupar entregas em rotas por veículo/motorista | S |
| RF-LOG-3 | Confirmar entrega (data/hora, recebedor, ocorrência) | M |
| RF-LOG-4 | Registrar devolução/recusa na entrega | S |
| RF-LOG-5 | Controle de retorno de cascos/vasilhames | C |

## 2.8 Módulo: Relatórios e BI (REL)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-REL-1 | Vendas por período, cliente, produto, vendedor | M |
| RF-REL-2 | Curva ABC de produtos e clientes | S |
| RF-REL-3 | Posição de estoque e ruptura | M |
| RF-REL-4 | DRE gerencial simplificado | C |
| RF-REL-5 | Exportação em CSV/PDF | S |
| RF-REL-6 | Dashboard com indicadores-chave (KPIs) | S |

## 2.9 Requisitos não-funcionais (RNF)

| ID | Requisito |
|----|-----------|
| RNF-1 **Desempenho** | Operações de tela devem responder em < 1s em condições normais; listagens paginadas |
| RNF-2 **Escalabilidade** | Arquitetura preparada para crescimento horizontal do backend |
| RNF-3 **Segurança** | Dados sensíveis criptografados em trânsito (HTTPS) e senhas em hash; RBAC |
| RNF-4 **Auditabilidade** | Log de auditoria imutável para operações financeiras e de estoque |
| RNF-5 **Disponibilidade** | Alvo de 99% em horário comercial; backups automáticos do banco |
| RNF-6 **Usabilidade** | Interface responsiva; fluxos críticos em poucos cliques; feedback claro |
| RNF-7 **Internacionalização** | pt-BR como padrão; valores monetários em BRL; fuso America/Sao_Paulo |
| RNF-8 **Manutenibilidade** | Cobertura de testes automatizados nos fluxos críticos; código tipado |
| RNF-9 **Observabilidade** | Logs estruturados, métricas e health checks |
| RNF-10 **LGPD** | Tratamento de dados pessoais conforme a Lei Geral de Proteção de Dados |
