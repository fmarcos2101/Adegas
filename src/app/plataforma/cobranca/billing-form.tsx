"use client";

import { useActionState } from "react";
import {
  saveBillingSettingsAction,
  type BillingActionState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: BillingActionState = {};

type Props = {
  mpAccessTokenMasked: string;
  hasToken: boolean;
  hasWebhookSecret: boolean;
  basicPrice: number;
  proPrice: number;
  webhookUrl: string;
};

export function BillingSettingsForm({
  mpAccessTokenMasked,
  hasToken,
  hasWebhookSecret,
  basicPrice,
  proPrice,
  webhookUrl,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveBillingSettingsAction,
    initial,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mercado Pago — Assinaturas</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <p className="text-sm text-slate-500">
            Use o Access Token da aplicação Mercado Pago da <strong>sua</strong>{" "}
            conta (recebedor das mensalidades). Ative os webhooks{" "}
            <code className="text-xs">subscription_preapproval</code> e{" "}
            <code className="text-xs">subscription_authorized_payment</code>.
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="mpAccessToken">
              Access Token
            </label>
            <Input
              id="mpAccessToken"
              name="mpAccessToken"
              type="password"
              placeholder={
                hasToken
                  ? `Configurado (${mpAccessTokenMasked}) — deixe em branco para manter`
                  : "APP_USR-..."
              }
              autoComplete="off"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="mpWebhookSecret">
              Webhook Secret (opcional)
            </label>
            <Input
              id="mpWebhookSecret"
              name="mpWebhookSecret"
              type="password"
              placeholder={
                hasWebhookSecret
                  ? "Configurado — deixe em branco para manter"
                  : "Segredo do painel de Webhooks do MP"
              }
              autoComplete="off"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="basicPrice">
                Preço Básico (R$/mês)
              </label>
              <Input
                id="basicPrice"
                name="basicPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={basicPrice}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="proPrice">
                Preço Plus/Pro (R$/mês)
              </label>
              <Input
                id="proPrice"
                name="proPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={proPrice}
                required
              />
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-800">URL do webhook</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-600">
              {webhookUrl}
            </p>
          </div>

          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
              {state.success}
            </p>
          ) : null}

          <Button
            type="submit"
            className="bg-teal-700 hover:bg-teal-600"
            disabled={pending}
          >
            {pending ? "Salvando..." : "Salvar configuração"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
