"use client";

import { useActionState } from "react";
import {
  updateTenantProfileAction,
  type PlatformActionState,
} from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: PlatformActionState = {};

export function TenantProfileForm({
  tenantId,
  name,
  notes,
  slug,
  trialEndsAtLabel,
  createdAtLabel,
}: {
  tenantId: string;
  name: string;
  notes: string;
  slug: string;
  trialEndsAtLabel: string | null;
  createdAtLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateTenantProfileAction,
    initial,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da loja</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="tenantId" value={tenantId} />
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="name">
              Nome
            </label>
            <Input id="name" name="name" defaultValue={name} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Código de login</label>
            <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm">
              {slug}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="notes">
              Notas internas (só você vê)
            </label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={notes}
              rows={3}
              placeholder="Contato, WhatsApp, acordo comercial…"
              className="flex w-full rounded-md border border-white/10 bg-white px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-zinc-400">
            Criada em {createdAtLabel}
            {trialEndsAtLabel ? ` · trial até ${trialEndsAtLabel}` : ""}
          </p>

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
            {pending ? "Salvando..." : "Salvar dados"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
