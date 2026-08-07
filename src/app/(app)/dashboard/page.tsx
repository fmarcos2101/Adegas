import { AlertTriangle, DollarSign, Package, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function DashboardPage() {
  const session = await requireTenantSession();
  const tenantId = session.tenantId;

  const [salesToday, monthRevenue, activeProducts, lowStock] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: "CONCLUIDA",
        createdAt: { gte: startOfToday() },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: {
        tenantId,
        status: "CONCLUIDA",
        createdAt: { gte: startOfMonth() },
      },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { tenantId, active: true } }),
    prisma.product.findMany({
      where: { tenantId, active: true },
      orderBy: { stock: "asc" },
    }),
  ]);

  const lowStockItems = lowStock.filter((p) => p.stock <= p.minStock);

  const cards = [
    {
      title: "Vendas de hoje",
      value: String(salesToday._count),
      icon: ShoppingCart,
      hint: `${formatBRL(salesToday._sum.total ?? 0)} faturado`,
    },
    {
      title: "Faturamento do mês",
      value: formatBRL(monthRevenue._sum.total ?? 0),
      icon: DollarSign,
    },
    {
      title: "Produtos ativos",
      value: String(activeProducts),
      icon: Package,
    },
    {
      title: "Alertas de estoque",
      value: String(lowStockItems.length),
      icon: AlertTriangle,
      danger: lowStockItems.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Visão geral — {session.tenantName}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{c.title}</CardTitle>
                <Icon
                  className={
                    c.danger ? "h-5 w-5 text-red-500" : "h-5 w-5 text-zinc-500"
                  }
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900">
                  {c.value}
                </div>
                {c.hint ? (
                  <p className="mt-1 text-xs text-zinc-400">{c.hint}</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos com estoque mínimo</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Nenhum produto abaixo do estoque mínimo.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-400">
                  <th className="py-2">Produto</th>
                  <th className="py-2">Estoque</th>
                  <th className="py-2">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 font-medium text-red-600">{p.stock}</td>
                    <td className="py-2 text-zinc-400">{p.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
