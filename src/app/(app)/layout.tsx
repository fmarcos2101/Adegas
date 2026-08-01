import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BrandHeader
          subtitle={
            session.role === "ADMIN"
              ? "Painel administrativo"
              : "Operador de Caixa"
          }
        >
          <span className="text-sm font-medium text-white/90">
            {session.name}
          </span>
          <form action={logoutAction}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </BrandHeader>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
