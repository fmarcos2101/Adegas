import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "./category-form";
import { deleteCategory } from "./actions";

export default async function CategoriasPage() {
  const session = await requireTenantSession();
  const categories = await prisma.category.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Categorias</h1>
        <p className="text-sm text-neutral-500">Organize os produtos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorias ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma categoria.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-2">Nome</th>
                  <th className="py-2">Produtos</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100">
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2 text-neutral-500">{c._count.products}</td>
                    <td className="py-2 text-right">
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 disabled:opacity-30"
                          disabled={c._count.products > 0}
                          title={
                            c._count.products > 0
                              ? "Categoria com produtos não pode ser removida"
                              : "Remover"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </td>
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
