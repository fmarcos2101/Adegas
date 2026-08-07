"use client";

import { useActionState } from "react";
import {
  specialistLeadAction,
  type SpecialistLeadState,
} from "@/app/(marketing)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: SpecialistLeadState = {};

export function SpecialistForm() {
  const [state, formAction, pending] = useActionState(
    specialistLeadAction,
    initial,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-700">
          Nome
        </label>
        <Input id="name" name="name" required placeholder="Seu nome completo" />
      </div>
      <div className="space-y-1">
        <label htmlFor="whatsapp" className="text-sm font-medium text-zinc-700">
          WhatsApp
        </label>
        <Input
          id="whatsapp"
          name="whatsapp"
          required
          placeholder="(64) 99999-9999"
          inputMode="tel"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="cpf" className="text-sm font-medium text-zinc-700">
          CPF
        </label>
        <Input
          id="cpf"
          name="cpf"
          required
          placeholder="000.000.000-00"
          inputMode="numeric"
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="voce@empresa.com"
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
          {state.success}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Enviando..." : "Falar com um especialista"}
        </Button>
      </div>
    </form>
  );
}
