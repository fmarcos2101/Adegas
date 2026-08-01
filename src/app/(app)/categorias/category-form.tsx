"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createCategory, type CategoryState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: CategoryState = {};

export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Categoria criada!");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex gap-2">
      <Input name="name" placeholder="Nova categoria (ex.: Cervejas)" />
      <Button type="submit" disabled={pending}>
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>
    </form>
  );
}
