"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { createUser, type UserState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: UserState = {};

export function UserForm() {
  const [state, action, pending] = useActionState(createUser, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Usuário criado!");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium">Nome</label>
        <Input name="name" placeholder="João Silva" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Usuário</label>
        <Input name="username" placeholder="joao" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Senha</label>
        <Input name="password" type="password" placeholder="••••" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Perfil</label>
        <select
          name="role"
          defaultValue="CAIXA"
          className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="CAIXA">Operador de Caixa</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          <UserPlus className="h-4 w-4" />
          {pending ? "Salvando..." : "Criar"}
        </Button>
      </div>
    </form>
  );
}
