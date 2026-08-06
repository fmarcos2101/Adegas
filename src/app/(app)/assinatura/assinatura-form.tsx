"use client";

import { useActionState } from "react";
import { startTenantCheckoutAction, type AssinaturaState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

const initial: AssinaturaState = {};

type Props = {
  basicPrice: number;
  proPrice: number;
  currentPlan: string;
  currentStatus: string;
  payerEmail: string;
  mpInitPoint: string | null;
  mpStatus: string | null;
  lastPaymentAt: string | null;
  lastPaymentAmount: number | null;
  billingConfigured: boolean;
  trialExpired: boolean;
  trialDaysLeft: number;
  trialEndsLabel: string | null;
};

export function AssinaturaCheckoutForm({
  basicPrice,
  proPrice,
  currentPlan,
  currentStatus,
  payerEmail,
  mpInitPoint,
  mpStatus,
  lastPaymentAt,
  lastPaymentAmount,
  billingConfigured,
  trialExpired,
  trialDaysLeft,
  trialEndsLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(
    startTenantCheckoutAction,
    initial,
  );

  const initPoint = state.initPoint ?? mpInitPoint;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Situação atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            Plano: <strong>{currentPlan}</strong>
          </p>
          <p>
            Status: <strong>{currentStatus}</strong>
          </p>
          {trialExpired ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
              Seu teste grátis de 7 dias acabou. Escolha um plano abaixo para
              continuar usando o sistema.
            </p>
          ) : trialDaysLeft > 0 && trialEndsLabel ? (
            <p className="text-teal-800">
              Teste grátis: {trialDaysLeft}{" "}
              {trialDaysLeft === 1 ? "dia" : "dias"} restantes (até{" "}
              {trialEndsLabel}). Ao assinar agora, a 1ª cobrança fica para depois
              do trial.
            </p>
          ) : null}
          {mpStatus ? (
            <p className="text-neutral-500">Mercado Pago: {mpStatus}</p>
          ) : null}
          {lastPaymentAt ? (
            <p className="text-neutral-500">
              Último pagamento: {lastPaymentAt}
              {lastPaymentAmount != null
                ? ` · ${formatBRL(lastPaymentAmount)}`
                : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinar / renovar com Mercado Pago</CardTitle>
        </CardHeader>
        <CardContent>
          {!billingConfigured ? (
            <p className="text-sm text-amber-700">
              A cobrança automática ainda não foi configurada pelo administrador
              da plataforma. Entre em contato com o suporte.
            </p>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer flex-col rounded-md border border-neutral-200 p-4 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="plan"
                      value="BASIC"
                      defaultChecked={currentPlan !== "Pro"}
                      className="accent-teal-700"
                    />
                    Básico
                  </span>
                  <span className="mt-1 text-sm text-neutral-500">
                    {formatBRL(basicPrice)} / mês
                  </span>
                </label>
                <label className="flex cursor-pointer flex-col rounded-md border border-neutral-200 p-4 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="plan"
                      value="PRO"
                      defaultChecked={currentPlan === "Pro"}
                      className="accent-teal-700"
                    />
                    Pro
                  </span>
                  <span className="mt-1 text-sm text-neutral-500">
                    {formatBRL(proPrice)} / mês
                  </span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="payerEmail">
                  E-mail da conta Mercado Pago
                </label>
                <Input
                  id="payerEmail"
                  name="payerEmail"
                  type="email"
                  required
                  defaultValue={payerEmail}
                  placeholder="seu@email.com"
                />
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
                {pending ? "Gerando link..." : "Gerar link de pagamento"}
              </Button>
            </form>
          )}

          {initPoint ? (
            <a
              href={initPoint}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-500"
            >
              Ir para o checkout Mercado Pago
            </a>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
