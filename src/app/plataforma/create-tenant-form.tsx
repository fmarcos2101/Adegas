"use client";

import { useActionState } from "react";
import { createTenantAction, type PlatformActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: PlatformActionState = {};

export function CreateTenantForm() {
  const [state, formAction, pending] = useActionState(createTenantAction, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova loja</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="name">
              Nome
            </label>
            <Input id="name" name="name" placeholder="Mercado Central" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="slug">
              Código (login)
            </label>
            <Input
              id="slug"
              name="slug"
              placeholder="mercado-central"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="adminUser">
              Usuário admin inicial
            </label>
            <Input id="adminUser" name="adminUser" defaultValue="admin" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="adminPass">
              Senha inicial
            </label>
            <Input
              id="adminPass"
              name="adminPass"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-900">
            Toda loja nova ganha <strong>7 dias de teste grátis</strong>. Depois
            precisa assinar (Mercado Pago).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="plan">
                Plano previsto
              </label>
              <select
                id="plan"
                name="plan"
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                defaultValue="TRIAL"
              >
                <option value="TRIAL">Trial → depois escolher</option>
                <option value="BASIC">Básico · 1 PDV</option>
                <option value="PLUS">Plus · até 3 PDVs</option>
                <option value="PRO">Pro · até 3 PDVs</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="priceMonthly">
                Valor R$/mês
              </label>
              <Input
                id="priceMonthly"
                name="priceMonthly"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
              />
            </div>
          </div>

          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-900">
              {state.success}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-zinc-100 hover:bg-white"
            disabled={pending}
          >
            {pending ? "Criando..." : "Criar loja"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
