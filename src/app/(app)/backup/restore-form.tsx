"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { restoreBackup, type RestoreState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: RestoreState = {};

export function RestoreForm() {
  const [state, action, pending] = useActionState(restoreBackup, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Backup restaurado com sucesso!");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input
        type="file"
        name="file"
        accept=".db,application/octet-stream"
        className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
      />
      <Button type="submit" variant="destructive" disabled={pending}>
        <Upload className="h-4 w-4" />
        {pending ? "Restaurando..." : "Restaurar backup"}
      </Button>
      <p className="text-xs text-zinc-400">
        Atenção: a restauração substitui todos os dados atuais pelo conteúdo do
        arquivo enviado.
      </p>
    </form>
  );
}
