import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
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
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <div className="text-sm text-neutral-500">
            Perfil:{" "}
            <span className="font-medium text-neutral-900">
              {session.role === "ADMIN" ? "Administrador" : "Operador de Caixa"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-800">
              {session.name}
            </span>
            <form action={logoutAction}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
