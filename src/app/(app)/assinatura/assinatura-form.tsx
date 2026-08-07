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
            <p className="rounded-md bg-amber-950/40 px-3 py-2 text-amber-100">
              Seu teste grátis de 7 dias acabou. Escolha um plano abaixo para
              continuar usando o sistema.
            </p>
          ) : trialDaysLeft > 0 && trialEndsLabel ? (
            <p className="text-zinc-100">
              Teste grátis: {trialDaysLeft}{" "}
              {trialDaysLeft === 1 ? "dia" : "dias"} restantes (até{" "}
              {trialEndsLabel}). Ao assinar agora, a 1ª cobrança fica para depois
              do trial.
            </p>
          ) : null}
          {mpStatus ? (
            <p className="text-zinc-400">Mercado Pago: {mpStatus}</p>
          ) : null}
          {lastPaymentAt ? (
            <p className="text-zinc-400">
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
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex cursor-pointer flex-col rounded-md border border-white/10 p-4 has-[:checked]:border-zinc-400 has-[:checked]:bg-white/5">
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="plan"
                      value="BASIC"
                      defaultChecked={currentPlan.includes("Básico")}
                      className="accent-zinc-300"
                    />
                    Básico
                  </span>
                  <span className="mt-1 text-sm text-zinc-400">
                    {formatBRL(basicPrice)} / mês
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">1 PDV</span>
                </label>
                <label className="flex cursor-pointer flex-col rounded-md border border-white/10 p-4 has-[:checked]:border-zinc-400 has-[:checked]:bg-white/5">
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="plan"
                      value="PLUS"
                      defaultChecked={currentPlan.includes("Plus")}
                      className="accent-zinc-300"
                    />
                    Plus
                  </span>
                  <span className="mt-1 text-sm text-zinc-400">
                    {formatBRL(proPrice)} / mês
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">
                    Até 3 PDVs
                  </span>
                </label>
                <label className="flex cursor-pointer flex-col rounded-md border border-white/10 p-4 has-[:checked]:border-zinc-400 has-[:checked]:bg-white/5">
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="plan"
                      value="PRO"
                      defaultChecked={currentPlan.includes("Pro")}
                      className="accent-zinc-300"
                    />
                    Pro
                  </span>
                  <span className="mt-1 text-sm text-zinc-400">
                    {formatBRL(proPrice)} / mês
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">
                    Até 3 PDVs
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
                <p className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
                  {state.error}
                </p>
              ) : null}
              {state.success ? (
                <p className="rounded-md bg-white/5 px-3 py-2 text-sm text-zinc-100">
                  {state.success}
                </p>
              ) : null}

              <Button
                type="submit"
                className="bg-zinc-100 hover:bg-white"
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
              className="maf-chrome-btn mt-4 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold"
            >
              Ir para o checkout Mercado Pago
            </a>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
