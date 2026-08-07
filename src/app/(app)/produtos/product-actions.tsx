"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Eraser } from "lucide-react";
import { deleteProduct, zeroStock } from "./actions";
import { Button } from "@/components/ui/button";
import { ProductEditForm } from "./product-edit-form";

type Category = { id: string; name: string };

export function ProductActions({
  product,
  categories,
}: {
  product: {
    id: string;
    name: string;
    stock: number;
    categoryId: string | null;
    cost: number;
    price: number;
    minStock: number;
    active: boolean;
  };
  categories: Category[];
}) {
  const [pending, startTransition] = useTransition();

  function handleZero() {
    if (!window.confirm(`Zerar o estoque de "${product.name}"?`)) return;
    startTransition(async () => {
      const res = await zeroStock(product.id);
      if (res.error) toast.error(res.error);
      else toast.success(res.message ?? "Estoque zerado.");
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (res.error) toast.error(res.error);
      else toast.success(res.message ?? "Produto excluído.");
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <ProductEditForm product={product} categories={categories} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-neutral-600"
        disabled={pending || product.stock === 0}
        onClick={handleZero}
        title="Zerar estoque"
      >
        <Eraser className="h-4 w-4" />
        Zerar
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-red-300"
        disabled={pending}
        onClick={handleDelete}
        title="Excluir produto"
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>
    </div>
  );
}
