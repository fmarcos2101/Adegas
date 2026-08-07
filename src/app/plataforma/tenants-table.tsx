"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { setTenantActiveAction } from "./actions";
import { StatusBadge } from "@/components/plataforma/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  notes: string | null;
  plan: string | null;
  planLabel: string;
  status: string | null;
  statusLabel: string;
  priceMonthly: number;
  trialEndsAt: string | null;
  payerEmail: string | null;
  users: number;
  products: number;
  monthSales: number;
  monthRevenue: number;
  needsAttention: boolean;
};

type FilterKey = "all" | "attention" | "trialing" | "active" | "past_due" | "inactive";

export function TenantsTable({ rows }: { rows: TenantRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const deferredQuery = useDeferredValue(query);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "trialing" && r.status !== "TRIALING") return false;
      if (filter === "active" && r.status !== "ACTIVE") return false;
      if (filter === "past_due" && r.status !== "PAST_DUE") return false;
      if (filter === "inactive" && r.active) return false;
      if (filter === "attention" && !r.needsAttention) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.payerEmail?.toLowerCase().includes(q) ?? false) ||
        (r.notes?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, deferredQuery, filter]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "attention", label: "Atenção" },
    { key: "trialing", label: "Trial" },
    { key: "active", label: "Ativas" },
    { key: "past_due", label: "Atrasadas" },
    { key: "inactive", label: "Inativas" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, código, e-mail ou nota…"
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? "rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-white"
                  : "rounded-md bg-[var(--maf-ink)] px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-slate-200"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhuma loja neste filtro.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-400">
                <th className="py-2 pr-3">Loja</th>
                <th className="py-2 pr-3">Plano</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Uso (mês)</th>
                <th className="py-2 pr-3">Mensal</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-white/5 align-top">
                  <td className="py-3 pr-3">
                    <div className="font-medium text-zinc-100">{t.name}</div>
                    <div className="text-xs text-zinc-400">
                      código <span className="font-mono">{t.slug}</span>
                      {!t.active ? " · inativa" : ""}
                    </div>
                    {t.payerEmail ? (
                      <div className="text-xs text-zinc-500">{t.payerEmail}</div>
                    ) : null}
                    {t.trialEndsAt && t.status === "TRIALING" ? (
                      <div className="text-xs text-sky-300">
                        Trial até{" "}
                        {new Date(t.trialEndsAt).toLocaleDateString("pt-BR")}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">{t.planLabel}</td>
                  <td className="py-3 pr-3">
                    {t.status ? (
                      <StatusBadge status={t.status} label={t.statusLabel} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <div>{t.monthSales} vendas</div>
                    <div className="text-xs text-zinc-400">
                      {formatBRL(t.monthRevenue)} · {t.users} users ·{" "}
                      {t.products} prod.
                    </div>
                  </td>
                  <td className="py-3 pr-3">{formatBRL(t.priceMonthly)}</td>
                  <td className="py-3">
                    <div className="flex flex-col items-start gap-1">
                      <Link
                        href={`/plataforma/lojas/${t.id}`}
                        className="font-medium text-zinc-200 hover:underline"
                      >
                        Gerenciar
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-zinc-400"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            setTenantActiveAction(t.id, !t.active),
                          )
                        }
                      >
                        {t.active ? "Suspender" : "Reativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
