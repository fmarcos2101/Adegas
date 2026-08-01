"use client";

import { useActionState } from "react";
import { Crown } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-adega.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/75" aria-hidden />
      <Card className="relative z-10 w-full max-w-sm border-pink-500/30 shadow-2xl shadow-pink-900/40 ring-1 ring-pink-500/40">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg shadow-pink-500/40">
              <Crown className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-neutral-900">
              Adega Faixa Rosa
            </h1>
            <p className="text-sm text-neutral-500">Sua adega, seu estilo.</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="username" className="text-sm font-medium">
                Usuário
              </label>
              <Input
                id="username"
                name="username"
                placeholder="admin"
                autoComplete="username"
                autoFocus
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
              className="w-full bg-pink-600 hover:bg-pink-500"
              disabled={pending}
            >
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
