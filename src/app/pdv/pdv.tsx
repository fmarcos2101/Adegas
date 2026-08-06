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
  CreditCard,
  Loader2,
  Hand,
  Split,
} from "lucide-react";
import {
  finalizeSale,
  createPendingTerminalSale,
  confirmSaleManually,
  cancelPendingSale,
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
type PaymentLine = { method: Method; amount: number };
type AwaitingPayment = {
  saleId: string;
  total: number;
  terminalAmount: number;
  paymentRef: string;
  method: Method;
  payments: PaymentLine[];
  provider?: "mercadopago" | "generic" | "sumup" | "ton";
  mpOrderId?: string;
};

type TerminalInfo = {
  label: string;
  configured: boolean;
  terminalProvider: "generic" | "mercadopago" | "sumup" | "ton";
};

const methods: { value: Method; label: string }[] = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "DEBITO", label: "Débito" },
  { value: "CREDITO", label: "Crédito" },
];

const CARD_METHODS: Method[] = ["DEBITO", "CREDITO"];

function methodLabel(method: Method): string {
  return methods.find((m) => m.value === method)?.label ?? method;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function Pdv({ terminal }: { terminal: TerminalInfo }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<Method>("DINHEIRO");
  const [splitPayment, setSplitPayment] = useState(false);
  const [method2, setMethod2] = useState<Method>("PIX");
  const [amount1, setAmount1] = useState(0);
  const [useTerminal, setUseTerminal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [awaiting, setAwaiting] = useState<AwaitingPayment | null>(null);
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState(1);
  const [predictions, setPredictions] = useState<FoundProduct[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [stockOpen, setStockOpen] = useState(false);
  const [stock, setStock] = useState<FoundProduct[]>([]);
  const [stockFilter, setStockFilter] = useState("");

  const locked = Boolean(awaiting);
  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = roundMoney(Math.max(0, subtotal - discount));

  const amount2 = splitPayment ? roundMoney(Math.max(0, total - amount1)) : 0;

  const paymentLines: PaymentLine[] = !splitPayment
    ? [{ method, amount: total }]
    : [
        { method, amount: roundMoney(amount1) },
        { method: method2, amount: amount2 },
      ];

  const hasCardPayment = paymentLines.some((p) => CARD_METHODS.includes(p.method));
  const canUseTerminal = hasCardPayment;

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

  function resetCheckout() {
    setCart([]);
    setDiscount(0);
    setMethod("DINHEIRO");
    setSplitPayment(false);
    setMethod2("PIX");
    setAmount1(0);
    setUseTerminal(false);
    setConfirmOpen(false);
    setAwaiting(null);
    inputRef.current?.focus();
  }

  function addToCart(product: FoundProduct, quantity = 1) {
    if (locked) return;
    const add = Math.max(1, Math.floor(quantity));
    setCart((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, quantity: l.quantity + add } : l,
        );
      }
      return [...prev, { ...product, quantity: add }];
    });
    setQuery("");
    setQty(1);
    setPredictions([]);
    setHighlight(-1);
    inputRef.current?.focus();
  }

  function scanExact(code: string, quantity: number) {
    if (locked) return;
    startTransition(async () => {
      const res = await findProductByBarcode(code);
      if (res.error || !res.product) {
        toast.error(res.error ?? "Produto não encontrado.");
        inputRef.current?.focus();
      } else {
        addToCart(res.product, quantity);
        toast.success(`${res.product.name} (x${Math.max(1, quantity)}) adicionado.`);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (locked) return;
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
        addToCart(p, qty);
        toast.success(`${p.name} (x${qty}) adicionado.`);
      } else {
        scanExact(code, qty);
      }
    } else if (e.key === "Escape") {
      setPredictions([]);
    }
  }

  function changeQty(id: string, delta: number) {
    if (locked) return;
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(id: string) {
    if (locked) return;
    setCart((prev) => prev.filter((l) => l.id !== id));
  }

  function validatePayments(): string | null {
    if (cart.length === 0) return "Carrinho vazio.";
    if (total <= 0) return "Total da venda deve ser maior que zero.";
    if (splitPayment) {
      if (method === method2) {
        return "No pagamento duplo, escolha formas diferentes.";
      }
      if (amount1 <= 0 || amount2 <= 0) {
        return "Informe valores positivos nas duas formas de pagamento.";
      }
      if (Math.abs(roundMoney(amount1 + amount2) - total) > 0.009) {
        return "A soma dos pagamentos deve ser igual ao total.";
      }
    }
    return null;
  }

  function buildPayload() {
    return {
      items: cart.map((l) => ({ productId: l.id, quantity: l.quantity })),
      discount,
      payments: paymentLines,
    };
  }

  /** Abre confirmação (venda manual) ou envia direto para a máquina. */
  function requestCheckout() {
    const err = validatePayments();
    if (err) {
      toast.error(err);
      return;
    }

    if (useTerminal && canUseTerminal) {
      startTransition(async () => {
        const res = await createPendingTerminalSale(buildPayload());
        if (res.error || !res.saleId || !res.paymentRef) {
          toast.error(res.error ?? "Falha ao enviar para a máquina.");
          return;
        }
        const lines: PaymentLine[] = (res.payments ?? paymentLines).map((p) => ({
          method: p.method as Method,
          amount: p.amount,
        }));
        const card =
          lines.find((p) => CARD_METHODS.includes(p.method)) ?? lines[0];
        setAwaiting({
          saleId: res.saleId,
          total: res.total ?? total,
          terminalAmount: res.terminalAmount ?? card.amount,
          paymentRef: res.paymentRef,
          method: card.method,
          payments: lines,
          provider: res.provider,
          mpOrderId: res.mpOrderId,
        });
        setCart([]);
        setDiscount(0);
        setConfirmOpen(false);
        toast.info(
          res.provider === "mercadopago"
            ? `Ordem enviada para ${terminal.label} — ref ${res.paymentRef}`
            : `Aguardando pagamento (${terminal.label}) — ref ${res.paymentRef}`,
        );
      });
      return;
    }

    // Venda manual: exige confirmação do método antes de liberar
    setConfirmOpen(true);
  }

  function confirmManualSale() {
    const err = validatePayments();
    if (err) {
      toast.error(err);
      return;
    }
    startTransition(async () => {
      const res = await finalizeSale(buildPayload());
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Venda finalizada! Total ${formatBRL(res.total ?? 0)}`);
      resetCheckout();
    });
  }

  function manualRelease() {
    if (!awaiting) return;
    startTransition(async () => {
      const res = await confirmSaleManually(awaiting.saleId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Venda liberada manualmente — ${formatBRL(awaiting.total)}`);
      resetCheckout();
    });
  }

  function cancelAwaiting() {
    if (!awaiting) return;
    startTransition(async () => {
      const res = await cancelPendingSale(awaiting.saleId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.info("Pagamento cancelado. Estoque reposto.");
      resetCheckout();
    });
  }

  function toggleStock() {
    setStockOpen((open) => {
      const next = !open;
      if (next) {
        startTransition(async () => {
          setStock(await listStock());
        });
      }
      return next;
    });
  }

  const filteredStock = stock.filter((p) =>
    p.name.toLowerCase().includes(stockFilter.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!awaiting) return;

    const poll = async () => {
      const res = await fetch(`/api/pagamentos/vendas/${awaiting.saleId}/status`);
      if (!res.ok) return;
      const data = (await res.json()) as { status?: string; total?: number };
      if (data.status === "CONCLUIDA") {
        toast.success(`Pagamento confirmado! Total ${formatBRL(data.total ?? awaiting.total)}`);
        resetCheckout();
      }
    };

    void poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [awaiting]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (awaiting || confirmOpen) return;
      if (e.key === "F2") {
        e.preventDefault();
        if (!pending && cart.length > 0) requestCheckout();
      } else if (e.key === "F3") {
        e.preventDefault();
        toggleStock();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) {
          setCart([]);
          toast.info("Carrinho limpo.");
          inputRef.current?.focus();
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Intencional: atalhos leem o estado atual a cada re-render relevante
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaiting, confirmOpen, pending, cart, discount, method, method2, amount1, splitPayment, useTerminal, canUseTerminal, total]);

  const secondMethodOptions = methods.filter((m) => m.value !== method);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {awaiting ? (
        <div className="lg:col-span-3">
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Loader2 className="h-5 w-5 animate-spin" />
                Aguardando pagamento na máquina
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-amber-800/70">Referência</p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-amber-950">
                    {awaiting.paymentRef}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-amber-800/70">
                    {awaiting.payments.length > 1 ? "Na máquina" : "Valor"}
                  </p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {formatBRL(awaiting.terminalAmount)}
                  </p>
                  {awaiting.payments.length > 1 ? (
                    <p className="mt-1 text-xs text-amber-900/70">
                      Total da venda {formatBRL(awaiting.total)}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs uppercase text-amber-800/70">Forma</p>
                  <p className="text-lg font-semibold text-amber-950">
                    {awaiting.payments
                      .map((p) => `${methodLabel(p.method)} ${formatBRL(p.amount)}`)
                      .join(" + ")}
                  </p>
                </div>
              </div>
              <p className="text-sm text-amber-900/80">
                {awaiting.provider === "mercadopago" ? (
                  <>
                    A ordem de <strong>{formatBRL(awaiting.terminalAmount)}</strong> (
                    {methodLabel(awaiting.method)}) foi enviada para{" "}
                    <strong>{terminal.label}</strong>. O cliente paga na maquininha; quando
                    aprovado, o PDV libera automaticamente. Referência:{" "}
                    <strong>{awaiting.paymentRef}</strong>
                    {awaiting.mpOrderId ? (
                      <>
                        {" "}
                        · Order: <code>{awaiting.mpOrderId}</code>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    Referência <strong>{awaiting.paymentRef}</strong> — cobre{" "}
                    <strong>{formatBRL(awaiting.terminalAmount)}</strong> na maquininha (
                    {terminal.label}) ou aguarde confirmação automática. Use{" "}
                    <strong>Liberar manualmente</strong> se necessário.
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="success" disabled={pending} onClick={manualRelease}>
                  <Hand className="h-4 w-4" />
                  Liberar manualmente
                </Button>
                <Button type="button" variant="outline" disabled={pending} onClick={cancelAwaiting}>
                  <X className="h-4 w-4" />
                  Cancelar pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Buscar produto (código, leitor ou iniciais)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={toggleStock} disabled={locked}>
              <Boxes className="h-4 w-4" />
              {stockOpen ? "Ocultar estoque" : "Consultar estoque"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="w-24 shrink-0">
                <Input
                  type="number"
                  min="1"
                  value={qty}
                  disabled={locked}
                  onChange={(e) =>
                    setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))
                  }
                  aria-label="Quantidade"
                  title="Quantidade"
                  className="text-center"
                />
              </div>
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  ref={inputRef}
                  value={query}
                  disabled={locked}
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
                            addToCart(p, qty);
                            toast.success(`${p.name} (x${qty}) adicionado.`);
                          }}
                          onMouseEnter={() => setHighlight(i)}
                          className={
                            "flex w-full items-center justify-between px-3 py-2 text-left text-sm " +
                            (i === highlight ? "bg-emerald-50" : "hover:bg-neutral-50")
                          }
                        >
                          <span className="font-medium text-neutral-800">{p.name}</span>
                          <span className="flex items-center gap-3 text-xs">
                            <span
                              className={
                                p.stock <= 0 ? "text-red-600" : "text-neutral-500"
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
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Atalhos: <kbd className="rounded border px-1">F8</kbd> busca,{" "}
              <kbd className="rounded border px-1">F2</kbd> finalizar,{" "}
              <kbd className="rounded border px-1">F4</kbd> limpar,{" "}
              <kbd className="rounded border px-1">F3</kbd> estoque.
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
                            disabled={locked}
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
                            disabled={locked}
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
                          disabled={locked}
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
                disabled={locked}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={splitPayment}
                disabled={locked}
                onChange={(e) => {
                  const on = e.target.checked;
                  setSplitPayment(on);
                  if (on) {
                    const half = roundMoney(total / 2);
                    setAmount1(half > 0 ? half : 0);
                    const fallback =
                      method === "PIX"
                        ? "DINHEIRO"
                        : method === "DINHEIRO"
                          ? "PIX"
                          : "PIX";
                    setMethod2(fallback);
                    if (!CARD_METHODS.includes(method) && !CARD_METHODS.includes(fallback)) {
                      setUseTerminal(false);
                    }
                  } else {
                    setUseTerminal(false);
                  }
                }}
                className="h-4 w-4 accent-pink-600"
              />
              <Split className="h-4 w-4 text-neutral-600" />
              <span>Pagamento duplo (duas formas)</span>
            </label>

            {!splitPayment ? (
              <div className="space-y-1">
                <label className="text-sm font-medium">Forma de pagamento</label>
                <select
                  value={method}
                  disabled={locked}
                  onChange={(e) => {
                    const next = e.target.value as Method;
                    setMethod(next);
                    if (!CARD_METHODS.includes(next)) setUseTerminal(false);
                  }}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                >
                  {methods.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3 rounded-md border border-neutral-200 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Duplo pagamento
                </p>
                <div className="space-y-1">
                  <label className="text-sm font-medium">1ª forma</label>
                  <div className="flex gap-2">
                    <select
                      value={method}
                      disabled={locked}
                      onChange={(e) => {
                        const next = e.target.value as Method;
                        setMethod(next);
                        if (next === method2) {
                          const alt = methods.find((m) => m.value !== next)?.value ?? "PIX";
                          setMethod2(alt);
                        }
                        if (
                          !CARD_METHODS.includes(next) &&
                          !CARD_METHODS.includes(method2)
                        ) {
                          setUseTerminal(false);
                        }
                      }}
                      className="flex h-10 min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                    >
                      {methods.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount1 || ""}
                      disabled={locked}
                      onChange={(e) => setAmount1(Number(e.target.value) || 0)}
                      className="w-28"
                      aria-label="Valor da 1ª forma"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">2ª forma</label>
                  <div className="flex gap-2">
                    <select
                      value={method2}
                      disabled={locked}
                      onChange={(e) => {
                        const next = e.target.value as Method;
                        setMethod2(next);
                        if (
                          !CARD_METHODS.includes(method) &&
                          !CARD_METHODS.includes(next)
                        ) {
                          setUseTerminal(false);
                        }
                      }}
                      className="flex h-10 min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                    >
                      {secondMethodOptions.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex h-10 w-28 items-center justify-end rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium">
                      {formatBRL(amount2)}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">
                    O 2º valor é calculado automaticamente (total − 1ª forma).
                  </p>
                </div>
              </div>
            )}

            {canUseTerminal ? (
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={useTerminal}
                  disabled={locked}
                  onChange={(e) => setUseTerminal(e.target.checked)}
                  className="h-4 w-4 accent-pink-600"
                />
                <CreditCard className="h-4 w-4 text-pink-700" />
                <span>
                  Cobrar na maquininha ({terminal.label})
                  {splitPayment
                    ? ` — só a parte em cartão`
                    : ""}
                </span>
              </label>
            ) : null}

            <div className="flex justify-between border-t border-neutral-200 pt-3 text-lg font-bold">
              <span>Total</span>
              <span className="text-emerald-700">{formatBRL(total)}</span>
            </div>
            <Button
              type="button"
              variant="success"
              size="lg"
              className="w-full"
              disabled={pending || cart.length === 0 || locked}
              onClick={requestCheckout}
            >
              <CheckCircle2 className="h-5 w-5" />
              {pending
                ? "Processando..."
                : useTerminal && canUseTerminal
                  ? `Enviar para ${terminal.label}`
                  : "Finalizar venda"}
            </Button>
            {cart.length > 0 && !locked ? (
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

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-payment-title"
        >
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="confirm-payment-title"
                  className="text-lg font-semibold text-neutral-900"
                >
                  Confirmar pagamento
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Confira a forma de pagamento antes de liberar a venda.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Total</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatBRL(total)}
                </span>
              </div>
              {paymentLines.map((p, i) => (
                <div
                  key={`${p.method}-${i}`}
                  className="flex justify-between border-t border-neutral-200 pt-2 text-sm"
                >
                  <span className="font-medium text-neutral-800">
                    {methodLabel(p.method)}
                    {splitPayment ? ` (${i + 1}ª)` : ""}
                  </span>
                  <span className="font-semibold">{formatBRL(p.amount)}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="success"
                className="flex-1"
                disabled={pending}
                onClick={confirmManualSale}
              >
                <CheckCircle2 className="h-4 w-4" />
                {pending ? "Liberando..." : "Confirmar e liberar venda"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
