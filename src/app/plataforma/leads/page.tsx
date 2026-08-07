import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PlatformShell } from "@/components/plataforma/platform-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PlataformaLeadsPage() {
  const session = await getSession();
  if (!session?.isPlatformAdmin) redirect("/login");

  const leads = await prisma.contactLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <PlatformShell
      userName={session.name}
      subtitle="Leads — falar com especialistas"
      activePath="/plataforma/leads"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-zinc-900">
          Leads
        </h1>
        <p className="text-sm text-zinc-500">
          Contatos que pediram atendimento de especialista na landing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos contatos ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum lead ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2 pr-3">Quando</th>
                    <th className="py-2 pr-3">Nome</th>
                    <th className="py-2 pr-3">WhatsApp</th>
                    <th className="py-2 pr-3">CPF</th>
                    <th className="py-2">E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-zinc-100">
                      <td className="py-3 pr-3 text-zinc-500">
                        {lead.createdAt.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 pr-3 font-medium text-zinc-900">
                        {lead.name}
                      </td>
                      <td className="py-3 pr-3">
                        <a
                          href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "").replace(/^55/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-800 hover:underline"
                        >
                          {lead.whatsapp}
                        </a>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs text-zinc-600">
                        {lead.cpf}
                      </td>
                      <td className="py-3 text-zinc-700">{lead.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PlatformShell>
  );
}
