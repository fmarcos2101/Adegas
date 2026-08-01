"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createProduct, type ProductState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Category = { id: string; name: string };

const initial: ProductState = {};

export function ProductForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(createProduct, initial);
  const [noBarcode, setNoBarcode] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Produto cadastrado com sucesso!");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo produto</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={action}
          onReset={() => setNoBarcode(false)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Nome</label>
            <Input name="name" placeholder="Cerveja Pilsen 350ml" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Código de barras</label>
            <Input
              name="barcode"
              placeholder={noBarcode ? "Gerado automaticamente" : "7891000000000"}
              disabled={noBarcode}
            />
            <label className="flex items-center gap-2 pt-1 text-sm text-neutral-600">
              <input
                type="checkbox"
                name="noBarcode"
                checked={noBarcode}
                onChange={(e) => setNoBarcode(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Sem código de barras
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Categoria</label>
            <select
              name="categoryId"
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              defaultValue=""
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
            <label className="text-sm font-medium">Custo (R$)</label>
            <Input name="cost" type="number" step="0.01" defaultValue="0" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Preço (R$)</label>
            <Input name="price" type="number" step="0.01" defaultValue="0" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Estoque inicial</label>
            <Input name="stock" type="number" defaultValue="0" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Estoque mínimo</label>
            <Input name="minStock" type="number" defaultValue="0" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} className="w-full">
              <Plus className="h-4 w-4" />
              {pending ? "Salvando..." : "Cadastrar produto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
