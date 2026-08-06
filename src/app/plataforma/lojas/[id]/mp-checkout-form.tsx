"use client";

import { useActionState } from "react";
import {
  generateCheckoutLinkAction,
  cancelMpSubscriptionAction,
  type BillingActionState,
} from "../../cobranca/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: BillingActionState = {};

type Props = {
  tenantId: string;
  defaultPlan: string;
  payerEmail: string;
  mpInitPoint: string | null;
  mpStatus: string | null;
  mpPreapprovalId: string | null;
  billingConfigured: boolean;
};

export function MpCheckoutForm({
  tenantId,
  defaultPlan,
  payerEmail,
  mpInitPoint,
  mpStatus,
  mpPreapprovalId,
  billingConfigured,
}: Props) {
  const [state, formAction, pending] = useActionState(
    generateCheckoutLinkAction,
    initial,
  );
  const [cancelState, cancelAction, cancelling] = useActionState(
    async () => cancelMpSubscriptionAction(tenantId),
    initial,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cobrança Mercado Pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!billingConfigured ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Configure o Access Token em{" "}
            <a href="/plataforma/cobranca" className="underline">
              Plataforma → Cobrança
            </a>{" "}
            antes de gerar links.
          </p>
        ) : null}

        {mpPreapprovalId ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            <p>
              Assinatura MP:{" "}
              <span className="font-mono text-xs">{mpPreapprovalId}</span>
            </p>
            <p className="text-slate-500">Status MP: {mpStatus ?? "—"}</p>
            {mpInitPoint ? (
              <a
                href={mpInitPoint}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-teal-700 hover:underline"
              >
                Abrir link de checkout
              </a>
            ) : null}
          </div>
        ) : null}

        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="tenantId" value={tenantId} />
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="payerEmail">
              E-mail do pagador (Mercado Pago)
            </label>
            <Input
              id="payerEmail"
              name="payerEmail"
              type="email"
              required
              defaultValue={payerEmail}
              placeholder="cliente@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="plan">
              Plano
            </label>
            <select
              id="plan"
              name="plan"
              defaultValue={defaultPlan === "PRO" ? "PRO" : "BASIC"}
              className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="BASIC">Básico</option>
              <option value="PRO">Pro</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="freeTrialDays">
              Trial (dias, opcional)
            </label>
            <Input
              id="freeTrialDays"
              name="freeTrialDays"
              type="number"
              min="0"
              defaultValue={0}
            />
          </div>

          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="break-all rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800 sm:col-span-2">
              {state.success}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-600"
              disabled={pending || !billingConfigured}
            >
              {pending ? "Gerando..." : "Gerar link de cobrança"}
            </Button>
          </div>
        </form>

        {mpPreapprovalId ? (
          <form action={cancelAction}>
            {cancelState.error ? (
              <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {cancelState.error}
              </p>
            ) : null}
            {cancelState.success ? (
              <p className="mb-2 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
                {cancelState.success}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="outline"
              disabled={cancelling}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {cancelling ? "Cancelando..." : "Cancelar no Mercado Pago"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
