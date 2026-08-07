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
  Store,
  CreditCard,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  newTab?: boolean;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/pdv", label: "Vendas (PDV)", icon: ShoppingCart, newTab: true },
  { href: "/produtos", label: "Produtos", icon: Package, adminOnly: true },
  { href: "/categorias", label: "Categorias", icon: Tags, adminOnly: true },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, adminOnly: true },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard, adminOnly: true },
  { href: "/assinatura", label: "Assinatura", icon: Receipt, adminOnly: true },
  { href: "/usuarios", label: "Usuários", icon: Users, adminOnly: true },
  { href: "/auditoria", label: "Auditoria", icon: ScrollText, adminOnly: true },
  { href: "/backup", label: "Backup", icon: Database, adminOnly: true },
];

type SidebarProps = {
  role: "ADMIN" | "CAIXA";
  storeName?: string | null;
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({
  role,
  storeName,
  mobileOpen = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const visible = items.filter((i) => !i.adminOnly || role === "ADMIN");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="flex h-20 items-center gap-2 border-b border-neutral-200 bg-gradient-to-br from-teal-700 to-slate-900 px-5">
        <Store className="h-5 w-5 text-teal-200" />
        <span className="text-lg font-extrabold leading-none tracking-tight text-white">
          {APP_NAME}
          {storeName ? (
            <>
              <br />
              <span className="text-xs font-medium normal-case tracking-normal text-teal-200/90">
                {storeName}
              </span>
            </>
          ) : null}
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const className = cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active && !item.newTab
              ? "bg-teal-700 text-white"
              : "text-neutral-700 hover:bg-teal-50",
          );

          if (item.newTab) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                onClick={onNavigate}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
