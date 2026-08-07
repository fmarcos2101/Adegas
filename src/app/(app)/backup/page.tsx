import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestoreForm } from "./restore-form";

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Backup</h1>
        <p className="text-sm text-zinc-400">
          Gere um backup do banco de dados ou restaure a partir de um arquivo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerar backup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-neutral-600">
            Baixe uma cópia completa do banco de dados (arquivo .db).
          </p>
          <a
            href="/api/backup/export"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
          >
            <Download className="h-4 w-4" />
            Baixar backup
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurar backup</CardTitle>
        </CardHeader>
        <CardContent>
          <RestoreForm />
        </CardContent>
      </Card>
    </div>
  );
}
