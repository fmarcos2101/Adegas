"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Barcode, Minus, Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  finalizeSale,
  findProductByBarcode,
  type FoundProduct,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

type CartLine = FoundProduct & { quantity: number };
type Method = "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO";

const methods: { value: Method; label: string }[] = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "DEBITO", label: "Débito" },
  { value: "CREDITO", label: "Crédito" },
];

export function Pdv() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<Method>("DINHEIRO");
  const [barcode, setBarcode] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function addToCart(product: FoundProduct) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function handleScan(e: React.FormEvent) {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    startTransition(async () => {
      const res = await findProductByBarcode(code);
      if (res.error || !res.product) {
        toast.error(res.error ?? "Produto não encontrado.");
      } else {
        addToCart(res.product);
        toast.success(`${res.product.name} adicionado.`);
      }
      setBarcode("");
      inputRef.current?.focus();
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.id === id ? { ...l, quantity: l.quantity + delta } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.id !== id));
  }

  function checkout() {
    if (cart.length === 0) {
      toast.error("Carrinho vazio.");
      return;
    }
    startTransition(async () => {
      const res = await finalizeSale({
        items: cart.map((l) => ({ productId: l.id, quantity: l.quantity })),
        discount,
        method,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Venda finalizada! Total ${formatBRL(res.total ?? 0)}`);
      setCart([]);
      setDiscount(0);
      setMethod("DINHEIRO");
      inputRef.current?.focus();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Leitor de código de barras</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  ref={inputRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Escaneie ou digite o código / nome"
                  className="pl-9"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={pending}>
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carrinho ({cart.length} itens)</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Nenhum item no carrinho.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-2">Produto</th>
                    <th className="py-2">Preço</th>
                    <th className="py-2 text-center">Qtd</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((l) => (
                    <tr key={l.id} className="border-b border-neutral-100">
                      <td className="py-2 font-medium">{l.name}</td>
                      <td className="py-2">{formatBRL(l.price)}</td>
                      <td className="py-2">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => changeQty(l.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center">{l.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => changeQty(l.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatBRL(l.price * l.quantity)}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => removeLine(l.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-medium">{formatBRL(subtotal)}</span>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Desconto (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Forma de pagamento</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as Method)}
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                {methods.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-lg font-bold">
              <span>Total</span>
              <span className="text-emerald-700">{formatBRL(total)}</span>
            </div>
            <Button
              type="button"
              variant="success"
              size="lg"
              className="w-full"
              disabled={pending || cart.length === 0}
              onClick={checkout}
            >
              <CheckCircle2 className="h-5 w-5" />
              {pending ? "Processando..." : "Finalizar venda"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
