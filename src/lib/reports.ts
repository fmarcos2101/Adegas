import { prisma } from "@/lib/prisma";
import { getPaymentSettings } from "@/lib/payment-settings";

export type Periodo = "dia" | "semana" | "mes";

export const PERIODO_LABEL: Record<Periodo, string> = {
  dia: "Hoje",
  semana: "Últimos 7 dias",
  mes: "Mês atual",
};

export function normalizePeriodo(value: string | undefined | null): Periodo {
  if (value === "semana" || value === "mes") return value;
  return "dia";
}

export function periodoStart(periodo: Periodo): Date {
  const now = new Date();
  if (periodo === "mes") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (periodo === "semana") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 6);
    return d;
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type ProductProfitRow = {
  name: string;
  quantity: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  fees: number;
  netProfit: number;
  marginPercent: number;
};

export interface ReportData {
  periodo: Periodo;
  label: string;
  start: Date;
  salesCount: number;
  revenue: number;
  /** Custo das mercadorias vendidas */
  cogs: number;
  /** Lucro bruto = receita − CMV */
  grossProfit: number;
  /** Taxas estimadas de cartão (débito/crédito) */
  cardFees: number;
  /** Lucro líquido = lucro bruto − taxas de cartão */
  netProfit: number;
  grossMarginPercent: number;
  netMarginPercent: number;
  debitFeePercent: number;
  creditFeePercent: number;
  /** @deprecated use grossProfit */
  profit: number;
  byMethod: { method: string; total: number }[];
  sales: {
    id: string;
    createdAt: Date;
    total: number;
    status: string;
    user: string;
    itemsCount: number;
    cancelReason: string | null;
  }[];
  topProducts: { name: string; quantity: number; total: number }[];
  productProfits: ProductProfitRow[];
}

const METHOD_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  DEBITO: "Débito",
  CREDITO: "Crédito",
};

function lineCost(it: {
  unitCost: number | null;
  product: { cost: number };
  quantity: number;
}) {
  const unit = it.unitCost ?? it.product.cost;
  return unit * it.quantity;
}

type SaleItemForReport = {
  unitCost: number | null;
  unitPrice: number;
  quantity: number;
  total: number;
  product: { cost: number; name: string };
};

/**
 * Busca os itens de venda para relatório. Se o banco ainda não tiver a
 * coluna `unitCost` (sistema recém-atualizado sem `prisma db push`), refaz a
 * consulta sem ela em vez de derrubar a página com Internal Server Error.
 */
async function getSaleItemsForReport(
  where: Record<string, unknown>,
): Promise<SaleItemForReport[]> {
  try {
    return await prisma.saleItem.findMany({
      where,
      select: {
        unitCost: true,
        unitPrice: true,
        quantity: true,
        total: true,
        product: { select: { cost: true, name: true } },
      },
    });
  } catch {
    const legacy = await prisma.saleItem.findMany({
      where,
      select: {
        unitPrice: true,
        quantity: true,
        total: true,
        product: { select: { cost: true, name: true } },
      },
    });
    return legacy.map((it) => ({ ...it, unitCost: null }));
  }
}

export async function getReport(periodo: Periodo): Promise<ReportData> {
  const start = periodoStart(periodo);
  const inRangeConcluida = {
    status: "CONCLUIDA" as const,
    createdAt: { gte: start },
  };

  const [agg, items, payments, sales, settings] = await Promise.all([
    prisma.sale.aggregate({
      where: inRangeConcluida,
      _sum: { total: true },
      _count: true,
    }),
    getSaleItemsForReport({ sale: inRangeConcluida }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { sale: inRangeConcluida },
      _sum: { amount: true },
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
      take: 200,
    }),
    getPaymentSettings(),
  ]);

  const revenue = agg._sum.total ?? 0;
  let cogs = 0;
  for (const it of items) {
    cogs += lineCost(it);
  }
  const grossProfit = revenue - cogs;

  const debitTotal =
    payments.find((p) => p.method === "DEBITO")?._sum.amount ?? 0;
  const creditTotal =
    payments.find((p) => p.method === "CREDITO")?._sum.amount ?? 0;
  const cardFees =
    (debitTotal * settings.debitFeePercent) / 100 +
    (creditTotal * settings.creditFeePercent) / 100;
  const netProfit = grossProfit - cardFees;

  const feeRate = revenue > 0 ? cardFees / revenue : 0;

  const productMap = new Map<
    string,
    { quantity: number; revenue: number; cogs: number }
  >();
  for (const it of items) {
    const cur = productMap.get(it.product.name) ?? {
      quantity: 0,
      revenue: 0,
      cogs: 0,
    };
    cur.quantity += it.quantity;
    cur.revenue += it.total;
    cur.cogs += lineCost(it);
    productMap.set(it.product.name, cur);
  }

  const productProfits: ProductProfitRow[] = [...productMap.entries()]
    .map(([name, v]) => {
      const gross = v.revenue - v.cogs;
      const fees = v.revenue * feeRate;
      const net = gross - fees;
      return {
        name,
        quantity: v.quantity,
        revenue: v.revenue,
        cogs: v.cogs,
        grossProfit: gross,
        fees,
        netProfit: net,
        marginPercent: v.revenue > 0 ? (gross / v.revenue) * 100 : 0,
      };
    })
    .sort((a, b) => b.grossProfit - a.grossProfit);

  const topProducts = productProfits
    .slice()
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((p) => ({ name: p.name, quantity: p.quantity, total: p.revenue }));

  return {
    periodo,
    label: PERIODO_LABEL[periodo],
    start,
    salesCount: agg._count,
    revenue,
    cogs,
    grossProfit,
    cardFees,
    netProfit,
    grossMarginPercent: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    netMarginPercent: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    debitFeePercent: settings.debitFeePercent,
    creditFeePercent: settings.creditFeePercent,
    profit: grossProfit,
    byMethod: payments.map((p) => ({
      method: METHOD_LABEL[p.method] ?? p.method,
      total: p._sum.amount ?? 0,
    })),
    sales: sales.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      total: s.total,
      status: s.status,
      user: s.user.name,
      itemsCount: s._count.items,
      cancelReason: s.cancelReason,
    })),
    topProducts,
    productProfits,
  };
}
