"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Boxes,
  BarChart3,
  Users,
  ScrollText,
  Database,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  newTab?: boolean;
};

const items: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/pdv", label: "Vendas (PDV)", icon: ShoppingCart, newTab: true },
  { href: "/produtos", label: "Produtos", icon: Package, adminOnly: true },
  { href: "/categorias", label: "Categorias", icon: Tags, adminOnly: true },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, adminOnly: true },
  { href: "/usuarios", label: "Usuários", icon: Users, adminOnly: true },
  { href: "/auditoria", label: "Auditoria", icon: ScrollText, adminOnly: true },
  { href: "/backup", label: "Backup", icon: Database, adminOnly: true },
];

export function Sidebar({ role }: { role: "ADMIN" | "CAIXA" }) {
  const pathname = usePathname();
  const visible = items.filter((i) => !i.adminOnly || role === "ADMIN");

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-20 items-center gap-2 border-b border-neutral-200 bg-gradient-to-br from-pink-600 to-pink-800 px-5">
        <Crown className="h-5 w-5 text-pink-200" />
        <span className="text-lg font-extrabold uppercase leading-none tracking-tight text-white">
          Adega
          <br />
          <span className="text-pink-200">Faixa Rosa</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visible.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const className = cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active && !item.newTab
              ? "bg-pink-600 text-white"
              : "text-neutral-700 hover:bg-pink-50",
          );

          if (item.newTab) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={className}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
