import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { isInternalBarcode } from "@/lib/constants";
import { ProductForm } from "./product-form";
import { ProductActions } from "./product-actions";

export default async function ProdutosPage() {
  const session = await requireTenantSession();
  const tenantId = session.tenantId;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Produtos</h1>
        <p className="text-sm text-zinc-400">
          Cadastre preço de custo e de venda para acompanhar o lucro
        </p>
      </div>

      <ProductForm categories={categories} />

      <Card>
        <CardHeader>
          <CardTitle>Produtos cadastrados ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Nenhum produto cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-zinc-400">
                    <th className="py-2">Produto</th>
                    <th className="py-2">Código</th>
                    <th className="py-2">Categoria</th>
                    <th className="py-2">Custo</th>
                    <th className="py-2">Venda</th>
                    <th className="py-2">Margem</th>
                    <th className="py-2">Estoque</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const margin =
                      p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                    return (
                      <tr
                        key={p.id}
                        className={
                          p.active
                            ? "border-b border-white/5"
                            : "border-b border-white/5 opacity-50"
                        }
                      >
                        <td className="py-2 font-medium">
                          {p.name}
                          {!p.active ? (
                            <span className="ml-2 rounded-full bg-[var(--maf-ink)] px-2 py-0.5 text-xs text-zinc-400">
                              inativo
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2 text-zinc-400">
                          {isInternalBarcode(p.barcode) ? (
                            <span className="italic text-zinc-500">
                              sem código
                            </span>
                          ) : (
                            p.barcode
                          )}
                        </td>
                        <td className="py-2 text-zinc-400">
                          {p.category?.name ?? "—"}
                        </td>
                        <td className="py-2">{formatBRL(p.cost)}</td>
                        <td className="py-2">{formatBRL(p.price)}</td>
                        <td
                          className={
                            margin >= 0
                              ? "py-2 text-emerald-300"
                              : "py-2 text-red-300"
                          }
                        >
                          {margin.toFixed(1)}%
                        </td>
                        <td
                          className={
                            p.stock <= p.minStock
                              ? "py-2 font-medium text-red-300"
                              : "py-2"
                          }
                        >
                          {p.stock}
                        </td>
                        <td className="py-2 text-right">
                          <ProductActions
                            product={{
                              id: p.id,
                              name: p.name,
                              stock: p.stock,
                              categoryId: p.categoryId,
                              cost: p.cost,
                              price: p.price,
                              minStock: p.minStock,
                              active: p.active,
                            }}
                            categories={categories}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
