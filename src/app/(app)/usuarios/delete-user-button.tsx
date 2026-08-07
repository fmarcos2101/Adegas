"use client";

import { useActionState } from "react";
import { deleteUser, type UserState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: UserState = {};

export function DeleteUserButton({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const [state, formAction, pending] = useActionState(deleteUser, initial);

  return (
    <form
      action={formAction}
      className="inline-block"
      onSubmit={(e) => {
        if (!window.confirm(`Excluir o usuário "${username}"?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={userId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="border-red-300 text-red-700 hover:bg-red-50"
      >
        {pending ? "..." : "Excluir"}
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
