"use client";

import { useActionState } from "react";
import {
  updateSubscriptionAction,
  type PlatformActionState,
} from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: PlatformActionState = {};

type Props = {
  tenantId: string;
  active: boolean;
  plan: string;
  status: string;
  priceMonthly: number;
  notes: string;
  planLabel: string;
  statusLabel: string;
};

export function SubscriptionForm({
  tenantId,
  active,
  plan,
  status,
  priceMonthly,
  notes,
  planLabel,
  statusLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(
    updateSubscriptionAction,
    initial,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Assinatura{" "}
          <span className="text-sm font-normal text-slate-500">
            ({planLabel} · {statusLabel})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="tenantId" value={tenantId} />
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="plan">
              Plano
            </label>
            <select
              id="plan"
              name="plan"
              defaultValue={plan}
              className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="TRIAL">Trial (1 PDV)</option>
              <option value="BASIC">Básico (1 PDV)</option>
              <option value="PLUS">Plus (até 3 PDVs)</option>
              <option value="PRO">Pro (até 3 PDVs)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="TRIALING">Em trial</option>
              <option value="ACTIVE">Ativa</option>
              <option value="PAST_DUE">Pagamento atrasado</option>
              <option value="SUSPENDED">Suspensa</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="priceMonthly">
              Valor mensal (R$)
            </label>
            <Input
              id="priceMonthly"
              name="priceMonthly"
              type="number"
              step="0.01"
              min="0"
              defaultValue={priceMonthly}
            />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                value="true"
                defaultChecked={active}
                className="h-4 w-4 accent-teal-700"
              />
              Loja ativa (acesso liberado)
            </label>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="notes">
              Observações
            </label>
            <Input
              id="notes"
              name="notes"
              defaultValue={notes}
              placeholder="Pagamento via Pix, contrato, etc."
            />
          </div>

          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800 sm:col-span-2">
              {state.success}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-600"
              disabled={pending}
            >
              {pending ? "Salvando..." : "Salvar assinatura"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
