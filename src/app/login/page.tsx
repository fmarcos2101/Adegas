"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="maf-smoke absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div className="maf-panel relative z-10 w-full max-w-sm rounded-xl p-8 shadow-2xl shadow-black/50">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex flex-col items-center gap-3">
            <img src="/logo-maf.svg" alt={APP_NAME} width={96} height={58} className="h-14 w-auto" />
            <h1 className="font-display text-xl font-bold tracking-[0.16em] text-white">
              {APP_NAME}
            </h1>
          </Link>
          <p className="text-sm text-zinc-400">{APP_TAGLINE}</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="storeCode" className="text-sm font-medium text-zinc-300">
              Código da loja
            </label>
            <Input
              id="storeCode"
              name="storeCode"
              placeholder="ex.: demo (vazio = plataforma)"
              autoComplete="organization"
              autoFocus
              className="border-white/10 bg-black/40 text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="username" className="text-sm font-medium text-zinc-300">
              Usuário
            </label>
            <Input
              id="username"
              name="username"
              placeholder="admin"
              autoComplete="username"
              className="border-white/10 bg-black/40 text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">
              Senha
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="border-white/10 bg-black/40 text-white placeholder:text-zinc-600"
            />
          </div>

          {state.error ? (
            <p className="rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-300 ring-1 ring-red-900/60">
              {state.error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="maf-chrome-btn w-full border-0 font-semibold hover:brightness-105"
            disabled={pending}
          >
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Novo por aqui?{" "}
          <Link href="/cadastro" className="font-medium text-zinc-200 hover:text-white">
            Criar loja grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
