"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Barcode,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  Boxes,
  Search,
  X,
} from "lucide-react";
import {
  finalizeSale,
  findProductByBarcode,
  searchProducts,
  listStock,
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
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<FoundProduct[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [stockOpen, setStockOpen] = useState(false);
  const [stock, setStock] = useState<FoundProduct[]>([]);
  const [stockFilter, setStockFilter] = useState("");

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  // Busca de previsões (autocomplete) conforme o usuário digita as iniciais.
  useEffect(() => {
    const q = query.trim();
    const handle = setTimeout(async () => {
      if (q.length < 1) {
        setPredictions([]);
        setHighlight(-1);
        return;
      }
      const results = await searchProducts(q);
      setPredictions(results);
      setHighlight(-1);
    }, 150);
    return () => clearTimeout(handle);
  }, [query]);

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
    setQuery("");
    setPredictions([]);
    setHighlight(-1);
    inputRef.current?.focus();
  }

  function scanExact(code: string) {
    startTransition(async () => {
      const res = await findProductByBarcode(code);
      if (res.error || !res.product) {
        toast.error(res.error ?? "Produto não encontrado.");
        inputRef.current?.focus();
      } else {
        addToCart(res.product);
        toast.success(`${res.product.name} adicionado.`);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const code = query.trim();
      if (!code) return;
      if (highlight >= 0 && predictions[highlight]) {
        const p = predictions[highlight];
        addToCart(p);
        toast.success(`${p.name} adicionado.`);
      } else {
        scanExact(code);
      }
    } else if (e.key === "Escape") {
      setPredictions([]);
    }
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, quantity: l.quantity + delta } : l))
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

  function toggleStock() {
    const next = !stockOpen;
    setStockOpen(next);
    if (next) {
      startTransition(async () => {
        setStock(await listStock());
      });
    }
  }

  const filteredStock = stock.filter((p) =>
    p.name.toLowerCase().includes(stockFilter.trim().toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Buscar produto (código, leitor ou iniciais)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleStock}
            >
              <Boxes className="h-4 w-4" />
              {stockOpen ? "Ocultar estoque" : "Consultar estoque"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Barcode className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escaneie, digite o código ou as iniciais do produto"
                className="pl-9"
                autoFocus
                autoComplete="off"
              />
              {predictions.length > 0 ? (
                <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg">
                  {predictions.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(p);
                          toast.success(`${p.name} adicionado.`);
                        }}
                        onMouseEnter={() => setHighlight(i)}
                        className={
                          "flex w-full items-center justify-between px-3 py-2 text-left text-sm " +
                          (i === highlight ? "bg-emerald-50" : "hover:bg-neutral-50")
                        }
                      >
                        <span className="font-medium text-neutral-800">
                          {p.name}
                        </span>
                        <span className="flex items-center gap-3 text-xs">
                          <span
                            className={
                              p.stock <= 0
                                ? "text-red-600"
                                : "text-neutral-500"
                            }
                          >
                            estoque: {p.stock}
                          </span>
                          <span className="font-medium text-neutral-700">
                            {formatBRL(p.price)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Use ↑/↓ para navegar nas sugestões e Enter para adicionar.
            </p>
          </CardContent>
        </Card>

        {stockOpen ? (
          <Card>
            <CardHeader>
              <CardTitle>Consulta de estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  placeholder="Filtrar por nome"
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-neutral-500">
                      <th className="py-2">Produto</th>
                      <th className="py-2 text-right">Preço</th>
                      <th className="py-2 text-right">Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((p) => (
                      <tr key={p.id} className="border-b border-neutral-100">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-right">{formatBRL(p.price)}</td>
                        <td
                          className={
                            p.stock <= 0
                              ? "py-2 text-right font-medium text-red-600"
                              : "py-2 text-right"
                          }
                        >
                          {p.stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStock.length === 0 ? (
                  <p className="py-3 text-sm text-neutral-500">
                    Nenhum produto.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Carrinho ({cart.length} itens)</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-sm text-neutral-500">Nenhum item no carrinho.</p>
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
            {cart.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-neutral-500"
                onClick={() => setCart([])}
              >
                <X className="h-4 w-4" />
                Limpar carrinho
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
