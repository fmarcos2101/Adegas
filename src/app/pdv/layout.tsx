import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, LayoutDashboard, LogOut, Wine } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(app)/actions";

export default async function PdvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Wine className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold text-neutral-900">
            PDV — Distribuidora
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/estoque" target="_blank">
            <Button variant="outline" size="sm">
              <Boxes className="h-4 w-4" />
              Estoque
            </Button>
          </Link>
          {session.role === "ADMIN" ? (
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4" />
                Painel
              </Button>
            </Link>
          ) : null}
          <span className="text-sm font-medium text-neutral-800">
            {session.name}
          </span>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
