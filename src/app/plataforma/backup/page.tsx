import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { getSession } from "@/lib/auth";
import { PlatformShell } from "@/components/plataforma/platform-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestoreForm } from "./restore-form";

export default async function PlatformBackupPage() {
  const session = await getSession();
  if (!session?.isPlatformAdmin) redirect("/login");

  return (
    <PlatformShell
      userName={session.name}
      subtitle="Painel do administrador da plataforma"
      activePath="/plataforma/backup"
    >
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Backup completo do SaaS
        </h1>
        <p className="text-sm text-zinc-500">
          Exclusivo do dono da plataforma. Contém dados de{" "}
          <strong>todas as lojas</strong> — trate com o mesmo cuidado de uma
          credencial mestra.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerar backup completo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-neutral-600">
            Baixe uma cópia completa do banco de dados (todas as lojas,
            usuários, vendas e credenciais de pagamento). Guarde o arquivo em
            local seguro e criptografado.
          </p>
          <a
            href="/api/backup/export"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
          >
            <Download className="h-4 w-4" />
            Baixar backup completo
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurar backup completo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-neutral-600">
            Substitui <strong>todo</strong> o banco de dados do SaaS, afetando
            imediatamente todas as lojas. Use apenas em manutenção planejada.
          </p>
          <RestoreForm />
        </CardContent>
      </Card>
    </PlatformShell>
  );
}
