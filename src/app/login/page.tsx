"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
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
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0f766e_0%,_transparent_55%),linear-gradient(160deg,#0f172a_0%,#134e4a_45%,#0f172a_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <Card className="relative z-10 w-full max-w-sm border-teal-800/40 bg-white/95 shadow-2xl shadow-teal-950/50 backdrop-blur">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-white shadow-lg shadow-teal-900/30">
                <Store className="h-6 w-6" />
              </div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
                {APP_NAME}
              </h1>
            </Link>
            <p className="text-sm text-slate-500">{APP_TAGLINE}</p>
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

            <Button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-600"
              disabled={pending}
            >
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Novo por aqui?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-teal-800 hover:underline"
            >
              Criar loja grátis
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
