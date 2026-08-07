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
        <label htmlFor="storeName" className="text-sm font-medium text-slate-800">
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
        <label htmlFor="slug" className="text-sm font-medium text-slate-800">
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
        <p className="text-xs text-slate-500">
          Seus usuários entram com este código + usuário/senha.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="adminName" className="text-sm font-medium text-slate-800">
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
          <label htmlFor="adminUser" className="text-sm font-medium text-slate-800">
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
          <label htmlFor="adminPass" className="text-sm font-medium text-slate-800">
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
            className="text-sm font-medium text-slate-800"
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
        <legend className="text-sm font-medium text-slate-800">
          Plano após o teste ({TRIAL_DAYS} dias grátis agora)
        </legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50/60">
          <input
            type="radio"
            name="plan"
            value="BASIC"
            defaultChecked
            className="mt-1 accent-teal-700"
          />
          <span>
            <span className="block font-semibold text-slate-900">
              Básico — {formatBRL(basicPrice)}/mês
            </span>
            <span className="text-xs text-slate-500">1 PDV (caixa ativo)</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50/60">
          <input
            type="radio"
            name="plan"
            value="PLUS"
            className="mt-1 accent-teal-700"
          />
          <span>
            <span className="block font-semibold text-slate-900">
              Plus — {formatBRL(proPrice)}/mês
            </span>
            <span className="text-xs text-slate-500">Até 3 PDVs</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50/60">
          <input
            type="radio"
            name="plan"
            value="PRO"
            className="mt-1 accent-teal-700"
          />
          <span>
            <span className="block font-semibold text-slate-900">
              Pro — {formatBRL(proPrice)}/mês
            </span>
            <span className="text-xs text-slate-500">Até 3 PDVs</span>
          </span>
        </label>
      </fieldset>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full bg-teal-700 hover:bg-teal-600"
        disabled={pending}
      >
        {pending ? "Criando loja..." : `Começar ${TRIAL_DAYS} dias grátis`}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-teal-800 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
