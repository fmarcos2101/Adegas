import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { isInternalBarcode } from "@/lib/constants";
import { ProductForm } from "./product-form";
import { ProductActions } from "./product-actions";

export default async function ProdutosPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Produtos</h1>
        <p className="text-sm text-neutral-500">
          Cadastro e consulta de produtos
        </p>
      </div>

      <ProductForm categories={categories} />

      <Card>
        <CardHeader>
          <CardTitle>Produtos cadastrados ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Nenhum produto cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-2">Produto</th>
                    <th className="py-2">Código</th>
                    <th className="py-2">Categoria</th>
                    <th className="py-2">Preço</th>
                    <th className="py-2">Estoque</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className={
                        p.active
                          ? "border-b border-neutral-100"
                          : "border-b border-neutral-100 opacity-50"
                      }
                    >
                      <td className="py-2 font-medium">
                        {p.name}
                        {!p.active ? (
                          <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                            inativo
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-neutral-500">
                        {isInternalBarcode(p.barcode) ? (
                          <span className="italic text-neutral-400">
                            sem código
                          </span>
                        ) : (
                          p.barcode
                        )}
                      </td>
                      <td className="py-2 text-neutral-500">
                        {p.category?.name ?? "—"}
                      </td>
                      <td className="py-2">{formatBRL(p.price)}</td>
                      <td
                        className={
                          p.stock <= p.minStock
                            ? "py-2 font-medium text-red-600"
                            : "py-2"
                        }
                      >
                        {p.stock}
                      </td>
                      <td className="py-2 text-right">
                        <ProductActions id={p.id} name={p.name} stock={p.stock} />
                      </td>
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
