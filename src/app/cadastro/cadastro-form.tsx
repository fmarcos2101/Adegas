"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { cadastroAction, type CadastroState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TRIAL_DAYS } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";

const initialState: CadastroState = {};

type Props = {
  basicPrice: number;
  proPrice: number;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function CadastroForm({ basicPrice, proPrice }: Props) {
  const [state, formAction, pending] = useActionState(cadastroAction, initialState);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="storeName" className="text-sm font-medium text-zinc-300">
          Nome do negócio
        </label>
        <Input
          id="storeName"
          name="storeName"
          placeholder="Ex.: Distribuidora Centro"
          required
          autoFocus
          onChange={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="slug" className="text-sm font-medium text-zinc-300">
          Código da loja (usado no login)
        </label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="ex.: distribuidora-centro"
          required
          autoComplete="off"
        />
        <p className="text-xs text-zinc-500">
          Seus usuários entram com este código + usuário/senha.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="adminName" className="text-sm font-medium text-zinc-300">
            Seu nome
          </label>
          <Input
            id="adminName"
            name="adminName"
            placeholder="Nome do administrador"
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="adminUser" className="text-sm font-medium text-zinc-300">
            Usuário admin
          </label>
          <Input
            id="adminUser"
            name="adminUser"
            defaultValue="admin"
            required
            autoComplete="username"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="adminPass" className="text-sm font-medium text-zinc-300">
            Senha
          </label>
          <Input
            id="adminPass"
            name="adminPass"
            type="password"
            required
            minLength={4}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label
            htmlFor="adminPassConfirm"
            className="text-sm font-medium text-zinc-300"
          >
            Confirmar senha
          </label>
          <Input
            id="adminPassConfirm"
            name="adminPassConfirm"
            type="password"
            required
            minLength={4}
            autoComplete="new-password"
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-300">
          Plano após o teste ({TRIAL_DAYS} dias grátis agora)
        </legend>
        {(
          [
            {
              value: "BASIC",
              title: `Básico — ${formatBRL(basicPrice)}/mês`,
              detail: "1 PDV (caixa ativo)",
              defaultChecked: true,
            },
            {
              value: "PLUS",
              title: `Plus — ${formatBRL(proPrice)}/mês`,
              detail: "Até 3 PDVs",
            },
            {
              value: "PRO",
              title: `Pro — ${formatBRL(proPrice)}/mês`,
              detail: "Até 3 PDVs",
            },
          ] as const
        ).map((plan) => (
          <label
            key={plan.value}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-white/10 bg-black/25 p-3 has-[:checked]:border-zinc-300 has-[:checked]:bg-white/5"
          >
            <input
              type="radio"
              name="plan"
              value={plan.value}
              defaultChecked={"defaultChecked" in plan && plan.defaultChecked}
              className="mt-1 accent-zinc-300"
            />
            <span>
              <span className="block font-semibold text-zinc-100">
                {plan.title}
              </span>
              <span className="text-xs text-zinc-500">{plan.detail}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {state.error ? (
        <p className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Criando loja..." : `Começar ${TRIAL_DAYS} dias grátis`}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-zinc-200 hover:text-white">
          Entrar
        </Link>
      </p>
    </form>
  );
}
