import Link from "next/link";
import { LogOut } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(app)/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/plataforma", label: "Clientes", exact: true },
  { href: "/plataforma/cobranca", label: "Cobrança" },
  { href: "/plataforma/atividade", label: "Atividade" },
  { href: "/plataforma/leads", label: "Leads" },
];

export function PlatformShell({
  userName,
  subtitle = "Painel do administrador da plataforma",
  activePath,
  children,
}: {
  userName: string;
  subtitle?: string;
  activePath: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <BrandHeader subtitle={subtitle}>
        <span className="hidden text-sm text-zinc-300 sm:inline">{userName}</span>
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

      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 sm:px-8">
          {NAV.map((item) => {
            const active = item.exact
              ? activePath === item.href
              : activePath === item.href ||
                activePath.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition",
                  active
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-800",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
