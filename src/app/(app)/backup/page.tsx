import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Backup</h1>
        <p className="text-sm text-zinc-400">
          Exporte uma cópia dos dados desta loja
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exportar dados da loja</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-neutral-600">
            Baixe um arquivo (.json) com os dados desta loja: produtos,
            categorias, movimentações de estoque, vendas e usuários. Senhas e
            credenciais de pagamento não são incluídas.
          </p>
          <a
            href="/api/backup/export-tenant"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
          >
            <Download className="h-4 w-4" />
            Baixar dados da loja
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup completo e restauração</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            Por segurança, o backup completo do banco de dados (todas as
            lojas) e a restauração do sistema são exclusivos do dono da
            plataforma. Fale com o suporte se precisar restaurar dados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
