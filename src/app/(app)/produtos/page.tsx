import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { isInternalBarcode } from "@/lib/constants";
import { ProductForm } from "./product-form";

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
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-neutral-100">
                      <td className="py-2 font-medium">{p.name}</td>
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
