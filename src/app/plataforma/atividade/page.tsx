import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PlatformShell } from "@/components/plataforma/platform-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTION_LABEL: Record<string, string> = {
  TENANT_CREATE: "Loja criada",
  TENANT_SELF_SIGNUP: "Auto-cadastro",
  TENANT_UPDATE: "Loja atualizada",
  TENANT_ACTIVATE: "Loja reativada",
  TENANT_SUSPEND: "Loja suspensa",
  TENANT_DELETE: "Loja apagada",
  SUBSCRIPTION_UPDATE: "Assinatura alterada",
  PLATAFORMA_EXCLUIR_USUARIO: "Usuário excluído",
  EXCLUIR_USUARIO: "Usuário excluído",
  SUPPORT_ENTER: "Entrou como suporte",
  SUPPORT_EXIT: "Saiu do suporte",
  PLATAFORMA_CRIAR_USUARIO: "Usuário criado",
  PLATAFORMA_RESET_SENHA: "Senha resetada",
  PLATAFORMA_ATIVAR_USUARIO: "Usuário ativado",
  PLATAFORMA_INATIVAR_USUARIO: "Usuário inativado",
  MP_CHECKOUT_CRIADO: "Link MP gerado",
  MP_ASSINATURA_CANCELADA: "Assinatura MP cancelada",
  LOGIN_PLATAFORMA: "Login na plataforma",
};

export default async function PlataformaAtividadePage() {
  const session = await getSession();
  if (!session?.isPlatformAdmin) redirect("/login");

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { userId: session.userId },
        {
          action: {
            in: [
              "TENANT_CREATE",
              "TENANT_SELF_SIGNUP",
              "TENANT_UPDATE",
              "TENANT_ACTIVATE",
              "TENANT_SUSPEND",
              "TENANT_DELETE",
              "SUBSCRIPTION_UPDATE",
              "SUPPORT_ENTER",
              "SUPPORT_EXIT",
              "PLATAFORMA_CRIAR_USUARIO",
              "PLATAFORMA_RESET_SENHA",
              "PLATAFORMA_ATIVAR_USUARIO",
              "PLATAFORMA_INATIVAR_USUARIO",
              "PLATAFORMA_EXCLUIR_USUARIO",
              "MP_CHECKOUT_CRIADO",
              "MP_ASSINATURA_CANCELADA",
              "LOGIN_PLATAFORMA",
            ],
          },
        },
      ],
    },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      user: { select: { username: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <PlatformShell
      userName={session.name}
      subtitle="Histórico de ações da plataforma"
      activePath="/plataforma/atividade"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          Atividade
        </h1>
        <p className="text-sm text-slate-500">
          Auditoria do que você e o sistema fizeram nas lojas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas ações</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {ACTION_LABEL[log.action] ?? log.action}
                      {log.tenant ? (
                        <>
                          {" · "}
                          <Link
                            href={`/plataforma/lojas/${log.tenant.id}`}
                            className="text-teal-700 hover:underline"
                          >
                            {log.tenant.name}
                          </Link>
                          <span className="text-slate-400">
                            {" "}
                            ({log.tenant.slug})
                          </span>
                        </>
                      ) : null}
                    </p>
                    {log.detail ? (
                      <p className="text-xs text-slate-500">{log.detail}</p>
                    ) : null}
                    {log.user ? (
                      <p className="text-xs text-slate-400">
                        por {log.user.name} ({log.user.username})
                      </p>
                    ) : null}
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {log.createdAt.toLocaleString("pt-BR")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PlatformShell>
  );
}
