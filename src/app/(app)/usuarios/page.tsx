import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserForm } from "./user-form";
import { toggleUserActive } from "./actions";

export default async function UsuariosPage() {
  const [users, session] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    getSession(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Usuários</h1>
        <p className="text-sm text-neutral-500">Gestão de acessos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <tr key={u.id} className="border-b border-neutral-100">
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2 text-neutral-500">{u.username}</td>
                    <td className="py-2">
                      {u.role === "ADMIN" ? "Administrador" : "Caixa"}
                    </td>
                    <td className="py-2">
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
                    <td className="py-2 text-right">
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf ? "Você não pode alterar o próprio usuário" : ""
                          }
                        >
                          {u.active ? "Inativar" : "Ativar"}
                        </Button>
                      </form>
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
