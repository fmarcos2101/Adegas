"use client";

import { useActionState } from "react";
import {
  deleteTenantAction,
  type PlatformActionState,
} from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: PlatformActionState = {};

export function DeleteTenantForm({
  tenantId,
  slug,
  name,
}: {
  tenantId: string;
  slug: string;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(deleteTenantAction, initial);

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-800">Zona de perigo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          <strong>Cancelar assinatura</strong> só bloqueia o acesso e{" "}
          <strong>mantém</strong> produtos, vendas e usuários.
        </p>
        <p className="text-sm text-red-800">
          <strong>Apagar conta</strong> remove permanentemente a loja{" "}
          <span className="font-medium">{name}</span> e{" "}
          <strong>todo o banco dela</strong> (produtos, estoque, vendas,
          usuários). Irreversível.
        </p>
        <form
          action={formAction}
          className="space-y-3"
          onSubmit={(e) => {
            if (
              !window.confirm(
                `Apagar DEFINITIVAMENTE a loja "${name}" e todos os dados?`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="tenantId" value={tenantId} />
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="confirmSlug">
              Digite o código <span className="font-mono">{slug}</span> para
              confirmar
            </label>
            <Input
              id="confirmSlug"
              name="confirmSlug"
              autoComplete="off"
              placeholder={slug}
              required
            />
          </div>
          {state.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="outline"
            disabled={pending}
            className="border-red-400 text-red-700 hover:bg-red-50"
          >
            {pending ? "Apagando..." : "Apagar conta e todos os dados"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
