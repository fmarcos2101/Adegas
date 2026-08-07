"use client";

import { useActionState, useEffect, useRef } from "react";
import { resetUserPassword, type UserState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: UserState = {};

export function ResetPasswordForm({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const [state, formAction, pending] = useActionState(resetUserPassword, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <input type="hidden" name="userId" value={userId} />
      <Input
        name="password"
        type="password"
        placeholder={`Nova senha (${username})`}
        className="h-8 w-40"
        required
        minLength={4}
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "..." : "Resetar"}
      </Button>
      {state.error ? (
        <span className="w-full text-right text-xs text-red-300">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span className="w-full text-right text-xs text-zinc-200">
          Senha atualizada
        </span>
      ) : null}
    </form>
  );
}
