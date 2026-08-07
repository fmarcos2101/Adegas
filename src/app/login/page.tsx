"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(160,168,180,0.35),transparent_55%),linear-gradient(160deg,#f7f8fa_0%,#e6e8ee_50%,#f4f5f7_100%)]"
        aria-hidden
      />
      <Card className="relative z-10 w-full max-w-sm border-zinc-200/80 shadow-xl shadow-zinc-900/10">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Link href="/" className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-maf.png"
                alt={APP_NAME}
                width={120}
                height={68}
                className="h-16 w-auto object-contain"
              />
              <h1 className="font-display text-xl font-bold tracking-[0.14em] text-zinc-900">
                {APP_NAME}
              </h1>
            </Link>
            <p className="text-sm text-zinc-500">{APP_TAGLINE}</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="storeCode" className="text-sm font-medium">
                Código da loja
              </label>
              <Input
                id="storeCode"
                name="storeCode"
                placeholder="ex.: demo (vazio = plataforma)"
                autoComplete="organization"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="username" className="text-sm font-medium">
                Usuário
              </label>
              <Input
                id="username"
                name="username"
                placeholder="admin"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {state.error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {state.error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Novo por aqui?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-zinc-800 hover:underline"
            >
              Criar loja grátis
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
