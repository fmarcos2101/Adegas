"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createMovement, type StockState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Product = { id: string; name: string; stock: number };

const initial: StockState = {};

export function StockForm({ products }: { products: Product[] }) {
  const [state, action, pending] = useActionState(createMovement, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Movimentação registrada!");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-1 lg:col-span-2">
        <label className="text-sm font-medium">Produto</label>
        <select
          name="productId"
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Selecione...
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (estoque: {p.stock})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Tipo</label>
        <select
          name="type"
          defaultValue="ENTRADA"
          className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="ENTRADA">Entrada</option>
          <option value="SAIDA">Saída</option>
          <option value="AJUSTE">Ajuste (definir total)</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Quantidade</label>
        <Input name="quantity" type="number" defaultValue="1" />
      </div>
      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
        <label className="text-sm font-medium">Motivo (opcional)</label>
        <Input name="reason" placeholder="Ex.: compra, perda, contagem" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Registrando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
