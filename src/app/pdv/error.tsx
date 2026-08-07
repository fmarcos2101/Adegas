"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PdvError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Erro no PDV:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Ocorreu um erro no PDV
        </h2>
        <p className="mt-1 max-w-md text-sm text-zinc-400">
          Isso pode acontecer se o sistema foi atualizado enquanto o PDV estava
          aberto em segundo plano. Recarregue a página antes de continuar
          vendendo — nenhuma venda em andamento foi perdida no banco de dados.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-zinc-500">Código: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>
          <RotateCw className="h-4 w-4" />
          Recarregar PDV
        </Button>
        <Button variant="outline" onClick={() => unstable_retry()}>
          Tentar de novo
        </Button>
      </div>
    </div>
  );
}
