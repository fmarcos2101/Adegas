"use client";

import { useActionState } from "react";
import {
  platformCreateUserAction,
  platformResetPasswordAction,
  platformToggleUserAction,
  type PlatformUserState,
} from "./user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: PlatformUserState = {};

type UserRow = {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "CAIXA";
  active: boolean;
};

type Props = {
  tenantId: string;
  users: UserRow[];
  pdvUsed: number;
  pdvMax: number;
  planLabel: string;
};

function ResetPasswordRow({
  tenantId,
  userId,
  username,
}: {
  tenantId: string;
  userId: string;
  username: string;
}) {
  const [state, formAction, pending] = useActionState(
    platformResetPasswordAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="userId" value={userId} />
      <div className="space-y-1">
        <label className="sr-only" htmlFor={`pass-${userId}`}>
          Nova senha de {username}
        </label>
        <Input
          id={`pass-${userId}`}
          name="password"
          type="password"
          placeholder="Nova senha"
          className="h-8 w-36"
          required
          minLength={4}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending}
        className="h-8"
      >
        {pending ? "..." : "Resetar senha"}
      </Button>
      {state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
      {state.success ? (
        <span className="text-xs text-teal-700">{state.success}</span>
      ) : null}
    </form>
  );
}

function ToggleUserButton({
  tenantId,
  userId,
  active,
}: {
  tenantId: string;
  userId: string;
  active: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    platformToggleUserAction,
    initial,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "..." : active ? "Inativar" : "Ativar"}
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}

export function PlatformUsersPanel({
  tenantId,
  users,
  pdvUsed,
  pdvMax,
  planLabel,
}: Props) {
  const [createState, createAction, creating] = useActionState(
    platformCreateUserAction,
    initial,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Usuários da loja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            PDVs (caixas ativos):{" "}
            <strong>
              {pdvUsed}/{pdvMax}
            </strong>{" "}
            · Plano {planLabel}. Admin não conta como vaga de PDV.
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Nome</th>
                <th className="py-2">Usuário</th>
                <th className="py-2">Perfil</th>
                <th className="py-2">Ativo</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 align-top">
                  <td className="py-3">{u.name}</td>
                  <td className="py-3 font-mono text-xs">{u.username}</td>
                  <td className="py-3">
                    {u.role === "ADMIN" ? "Admin" : "Caixa (PDV)"}
                  </td>
                  <td className="py-3">{u.active ? "Sim" : "Não"}</td>
                  <td className="space-y-2 py-3">
                    <ToggleUserButton
                      tenantId={tenantId}
                      userId={u.id}
                      active={u.active}
                    />
                    <ResetPasswordRow
                      tenantId={tenantId}
                      userId={u.id}
                      username={u.username}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="tenantId" value={tenantId} />
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="name">
                Nome
              </label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="username">
                Usuário
              </label>
              <Input id="username" name="username" required minLength={3} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="password">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={4}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="role">
                Perfil
              </label>
              <select
                id="role"
                name="role"
                className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
                defaultValue="CAIXA"
              >
                <option value="CAIXA">Caixa (usa 1 PDV)</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {createState.error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
                {createState.error}
              </p>
            ) : null}
            {createState.success ? (
              <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800 sm:col-span-2">
                {createState.success}
              </p>
            ) : null}

            <div className="sm:col-span-2">
              <Button
                type="submit"
                className="bg-teal-700 hover:bg-teal-600"
                disabled={creating}
              >
                {creating ? "Criando..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
