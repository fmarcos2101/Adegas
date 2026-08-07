"use client";

import { useState } from "react";
import { Menu, X, LogOut, LifeBuoy, ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(app)/actions";
import { exitSupportAction } from "@/app/plataforma/actions";
import { APP_NAME } from "@/lib/constants";

type AppShellProps = {
  role: "ADMIN" | "CAIXA";
  userName: string;
  storeName?: string | null;
  supportMode?: boolean;
  children: React.ReactNode;
};

export function AppShell({
  role,
  userName,
  storeName,
  supportMode,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <Sidebar
        role={role}
        storeName={storeName}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <BrandHeader
          brandName={storeName ? APP_NAME : APP_NAME}
          subtitle={
            supportMode
              ? `Suporte · ${storeName ?? "loja"}`
              : role === "ADMIN"
                ? "Painel administrativo"
                : "Operador de Caixa"
          }
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20 lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          {supportMode ? (
            <>
              <span className="hidden items-center gap-1 rounded-md bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-100 sm:inline-flex">
                <LifeBuoy className="h-3.5 w-3.5" />
                Modo suporte
              </span>
              <form action={exitSupportAction}>
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  className="border-amber-300/50 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Plataforma</span>
                </Button>
              </form>
            </>
          ) : null}
          <span className="hidden text-sm font-medium text-white/90 sm:inline">
            {userName}
          </span>
          <form action={logoutAction}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </form>
        </BrandHeader>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
