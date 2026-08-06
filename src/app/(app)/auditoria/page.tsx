import { format } from "date-fns";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireTenantSession();
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId: session.tenantId,
      ...(term
        ? {
            OR: [
              { action: { contains: term } },
              { detail: { contains: term } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Auditoria</h1>
        <p className="text-sm text-neutral-500">
          Histórico de ações sensíveis
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                name="q"
                defaultValue={term}
                placeholder="Buscar por ação ou detalhe (ex.: LOGIN, VENDA)"
                className="pl-9"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum registro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-2">Data</th>
                    <th className="py-2">Usuário</th>
                    <th className="py-2">Ação</th>
                    <th className="py-2">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-neutral-100">
                      <td className="py-2 whitespace-nowrap text-neutral-500">
                        {format(l.createdAt, "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="py-2">{l.user?.name ?? "—"}</td>
                      <td className="py-2 font-medium">{l.action}</td>
                      <td className="py-2 text-neutral-600">{l.detail ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
