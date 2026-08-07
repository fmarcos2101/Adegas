"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { updateProduct } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: string; name: string };

type ProductEdit = {
  id: string;
  name: string;
  categoryId: string | null;
  cost: number;
  price: number;
  minStock: number;
  active: boolean;
};

export function ProductEditForm({
  product,
  categories,
}: {
  product: ProductEdit;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateProduct({}, formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Produto atualizado!");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-neutral-600"
        onClick={() => setOpen(true)}
        title="Editar produto"
      >
        <Pencil className="h-4 w-4" />
        Editar
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          Editar produto
        </h2>
        <form action={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={product.id} />
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Nome</label>
            <Input name="name" defaultValue={product.name} required />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Categoria</label>
            <select
              name="categoryId"
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              defaultValue={product.categoryId ?? ""}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Preço de custo (R$)</label>
            <Input
              name="cost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={String(product.cost)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Preço de venda (R$)</label>
            <Input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={String(product.price)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Estoque mínimo</label>
            <Input
              name="minStock"
              type="number"
              min="0"
              defaultValue={String(product.minStock)}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product.active}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Produto ativo
            </label>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
