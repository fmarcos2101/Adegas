"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { cancelSale } from "./actions";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

type SaleRow = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  user: string;
  itemsCount: number;
  cancelReason: string | null;
};

export function SalesTable({
  sales,
  canCancel,
}: {
  sales: SaleRow[];
  canCancel: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleCancel(id: string) {
    const reason = window.prompt("Motivo do cancelamento:");
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("Motivo obrigatório.");
      return;
    }
    setBusyId(id);
    startTransition(async () => {
      const res = await cancelSale(id, reason);
      if (res.error) toast.error(res.error);
      else toast.success("Venda cancelada e estoque reposto.");
      setBusyId(null);
    });
  }

  if (sales.length === 0) {
    return <p className="text-sm text-zinc-400">Nenhuma venda no período.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-zinc-400">
            <th className="py-2">Data</th>
            <th className="py-2">Operador</th>
            <th className="py-2">Itens</th>
            <th className="py-2">Total</th>
            <th className="py-2">Status</th>
            {canCancel ? <th className="py-2 text-right">Ações</th> : null}
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} className="border-b border-white/5">
              <td className="py-2 text-zinc-400">{s.createdAt}</td>
              <td className="py-2">{s.user}</td>
              <td className="py-2">{s.itemsCount}</td>
              <td className="py-2 font-medium">{formatBRL(s.total)}</td>
              <td className="py-2">
                {s.status === "CANCELADA" ? (
                  <span
                    className="rounded-full bg-red-950/40 px-2 py-0.5 text-xs text-red-700"
                    title={s.cancelReason ?? undefined}
                  >
                    Cancelada
                  </span>
                ) : s.status === "AGUARDANDO_PAGAMENTO" ? (
                  <span className="rounded-full bg-amber-950/40 px-2 py-0.5 text-xs text-amber-200">
                    Aguardando pagamento
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-950/40 px-2 py-0.5 text-xs text-emerald-300">
                    Concluída
                  </span>
                )}
              </td>
              {canCancel ? (
                <td className="py-2 text-right">
                  {s.status === "CONCLUIDA" || s.status === "AGUARDANDO_PAGAMENTO" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-300"
                      disabled={pending && busyId === s.id}
                      onClick={() => handleCancel(s.id)}
                    >
                      <Ban className="h-4 w-4" />
                      Cancelar
                    </Button>
                  ) : (
                    "—"
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
