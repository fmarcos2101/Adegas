import { prisma } from "@/lib/prisma";

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

export interface ReportData {
  periodo: Periodo;
  label: string;
  start: Date;
  salesCount: number;
  revenue: number;
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
}

const METHOD_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  DEBITO: "Débito",
  CREDITO: "Crédito",
};

export async function getReport(periodo: Periodo): Promise<ReportData> {
  const start = periodoStart(periodo);
  const inRangeConcluida = {
    status: "CONCLUIDA" as const,
    createdAt: { gte: start },
  };

  const [agg, items, payments, sales] = await Promise.all([
    prisma.sale.aggregate({
      where: inRangeConcluida,
      _sum: { total: true },
      _count: true,
    }),
    prisma.saleItem.findMany({
      where: { sale: inRangeConcluida },
      include: { product: { select: { cost: true, name: true } } },
    }),
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
  ]);

  const profit = items.reduce(
    (sum, it) => sum + (it.unitPrice - it.product.cost) * it.quantity,
    0,
  );

  const productMap = new Map<string, { quantity: number; total: number }>();
  for (const it of items) {
    const cur = productMap.get(it.product.name) ?? { quantity: 0, total: 0 };
    cur.quantity += it.quantity;
    cur.total += it.total;
    productMap.set(it.product.name, cur);
  }
  const topProducts = [...productMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    periodo,
    label: PERIODO_LABEL[periodo],
    start,
    salesCount: agg._count,
    revenue: agg._sum.total ?? 0,
    profit,
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
  };
}
