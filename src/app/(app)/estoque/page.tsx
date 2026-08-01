import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockForm } from "./stock-form";

const typeLabels: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
  VENDA: "Venda",
};

export default async function EstoquePage() {
  const [products, movements, session] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: true },
    }),
    getSession(),
  ]);
  const canManage = session?.role === "ADMIN";

  const lowStock = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Estoque</h1>
        <p className="text-sm text-neutral-500">
          Movimentações e histórico de estoque
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <StockForm
            canManage={canManage}
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              stock: p.stock,
            }))}
          />
        </CardContent>
      </Card>

      {lowStock.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Alerta de estoque mínimo ({lowStock.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700"
                >
                  {p.name}: {p.stock}/{p.minStock}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma movimentação.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-2">Data</th>
                    <th className="py-2">Produto</th>
                    <th className="py-2">Tipo</th>
                    <th className="py-2">Qtd</th>
                    <th className="py-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-neutral-100">
                      <td className="py-2 text-neutral-500">
                        {format(m.createdAt, "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="py-2 font-medium">{m.product.name}</td>
                      <td className="py-2">{typeLabels[m.type] ?? m.type}</td>
                      <td
                        className={
                          m.quantity < 0
                            ? "py-2 font-medium text-red-600"
                            : "py-2 font-medium text-emerald-700"
                        }
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-2 text-neutral-500">{m.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
