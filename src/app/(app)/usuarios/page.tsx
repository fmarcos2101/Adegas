import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserForm } from "./user-form";
import { ResetPasswordForm } from "./reset-password-form";
import { toggleUserActive } from "./actions";
import { getPdvUsage } from "@/lib/plan-limits";
import { SUBSCRIPTION_PLAN_LABEL } from "@/lib/constants";

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session?.tenantId) return null;

  const [users, pdvUsage] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "asc" },
    }),
    getPdvUsage(session.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Usuários</h1>
        <p className="text-sm text-neutral-500">
          Gestão de acessos · PDVs: {pdvUsage.used}/{pdvUsage.max} (
          {SUBSCRIPTION_PLAN_LABEL[pdvUsage.plan] ?? pdvUsage.plan})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-neutral-500">
            Cada usuário <strong>Caixa</strong> ocupa 1 vaga de PDV. Plano Básico:
            1 PDV · Plus/Pro: até 3 PDVs. Administrador não consome vaga.
          </p>
          <UserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="py-2">Nome</th>
                <th className="py-2">Usuário</th>
                <th className="py-2">Perfil</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === session?.userId;
                return (
                  <tr key={u.id} className="border-b border-neutral-100 align-top">
                    <td className="py-3 font-medium">{u.name}</td>
                    <td className="py-3 text-neutral-500">{u.username}</td>
                    <td className="py-3">
                      {u.role === "ADMIN" ? "Administrador" : "Caixa (PDV)"}
                    </td>
                    <td className="py-3">
                      {u.active ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="space-y-2 py-3 text-right">
                      <form action={toggleUserActive} className="inline-block">
                        <input type="hidden" name="id" value={u.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "Você não pode alterar o próprio usuário"
                              : ""
                          }
                        >
                          {u.active ? "Inativar" : "Ativar"}
                        </Button>
                      </form>
                      {!isSelf ? (
                        <ResetPasswordForm
                          userId={u.id}
                          username={u.username}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
