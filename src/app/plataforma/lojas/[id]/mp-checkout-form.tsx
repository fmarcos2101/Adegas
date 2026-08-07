"use client";

import { useActionState, useState } from "react";
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

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/\S+/);
  return match?.[0] ?? null;
}

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
  const [copied, setCopied] = useState(false);

  const linkFromState = state.success ? extractUrl(state.success) : null;
  const checkoutUrl = linkFromState ?? mpInitPoint;

  async function copyLink() {
    if (!checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

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
          </div>
        ) : null}

        {checkoutUrl ? (
          <div className="rounded-md border border-teal-200 bg-teal-50/60 p-3 text-sm">
            <p className="font-medium text-teal-900">Link de checkout</p>
            <p className="mt-1 break-all font-mono text-xs text-teal-800">
              {checkoutUrl}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={copyLink}>
                {copied ? "Copiado!" : "Copiar link"}
              </Button>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-teal-800 hover:underline"
              >
                Abrir
              </a>
            </div>
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
              defaultValue={
                defaultPlan === "PLUS" || defaultPlan === "PRO"
                  ? defaultPlan
                  : "BASIC"
              }
              className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="BASIC">Básico (1 PDV)</option>
              <option value="PLUS">Plus (até 3 PDVs)</option>
              <option value="PRO">Pro (até 3 PDVs)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="freeTrialDays">
              Trial no MP (dias)
            </label>
            <Input
              id="freeTrialDays"
              name="freeTrialDays"
              type="number"
              min="0"
              placeholder="Auto (restante do trial de 7 dias)"
            />
            <p className="text-xs text-slate-500">
              Vazio = usa os dias restantes do teste grátis. 0 = cobra já.
            </p>
          </div>

          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
              {state.error}
            </p>
          ) : null}
          {state.success && !linkFromState ? (
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
          <form
            action={cancelAction}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  "Cancelar a assinatura no Mercado Pago e desativar a loja?",
                )
              ) {
                e.preventDefault();
              }
            }}
          >
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
