"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Erro na aplicação:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Ocorreu um erro inesperado
        </h2>
        <p className="mt-1 max-w-md text-sm text-zinc-400">
          Isso pode acontecer se o sistema foi atualizado enquanto esta página
          estava aberta. Recarregue a página para continuar.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-zinc-500">Código: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>
          <RotateCw className="h-4 w-4" />
          Recarregar página
        </Button>
        <Button variant="outline" onClick={() => unstable_retry()}>
          Tentar de novo
        </Button>
      </div>
    </div>
  );
}
