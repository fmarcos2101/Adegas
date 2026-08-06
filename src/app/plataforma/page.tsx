import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  ShoppingCart,
  CreditCard,
  LogOut,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutAction } from "@/app/(app)/actions";
import { CreateTenantForm } from "./create-tenant-form";
import {
  APP_NAME,
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/constants";
import { formatBRL } from "@/lib/utils";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function PlataformaPage() {
  const session = await getSession();
  if (!session?.isPlatformAdmin) redirect("/login");

  const monthStart = startOfMonth();

  const tenants = await prisma.tenant.findMany({
    include: {
      subscription: true,
      _count: {
        select: { users: true, products: true, sales: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const salesThisMonth = await prisma.sale.groupBy({
    by: ["tenantId"],
    where: {
      status: "CONCLUIDA",
      createdAt: { gte: monthStart },
    },
    _count: true,
    _sum: { total: true },
  });

  const usageByTenant = new Map(
    salesThisMonth.map((s) => [
      s.tenantId,
      { count: s._count, revenue: s._sum.total ?? 0 },
    ]),
  );

  const activeSubs = tenants.filter(
    (t) =>
      t.active &&
      t.subscription &&
      ["ACTIVE", "TRIALING"].includes(t.subscription.status),
  ).length;

  const mrr = tenants.reduce((acc, t) => {
    if (
      t.subscription &&
      ["ACTIVE", "PAST_DUE"].includes(t.subscription.status)
    ) {
      return acc + t.subscription.priceMonthly;
    }
    return acc;
  }, 0);

  const cards = [
    {
      title: "Lojas",
      value: String(tenants.length),
      icon: Building2,
      hint: `${activeSubs} com acesso ativo`,
    },
    {
      title: "MRR estimado",
      value: formatBRL(mrr),
      icon: CreditCard,
      hint: "Assinaturas ACTIVE/PAST_DUE",
    },
    {
      title: "Usuários (todas)",
      value: String(tenants.reduce((a, t) => a + t._count.users, 0)),
      icon: Users,
    },
    {
      title: "Vendas no mês",
      value: String(
        salesThisMonth.reduce((a, s) => a + s._count, 0),
      ),
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <BrandHeader subtitle="Painel da plataforma — clientes e assinaturas">
        <span className="hidden text-sm text-white/90 sm:inline">
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

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 p-4 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Controle SaaS — {APP_NAME}
            </h1>
            <p className="text-sm text-slate-500">
              Gerencie clientes, assinaturas e entre em qualquer loja para suporte.
            </p>
          </div>
          <Link
            href="/plataforma/cobranca"
            className="inline-flex h-9 items-center rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-600"
          >
            Cobrança Mercado Pago
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{c.title}</CardTitle>
                  <Icon className="h-5 w-5 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {c.value}
                  </div>
                  {c.hint ? (
                    <p className="mt-1 text-xs text-slate-500">{c.hint}</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {tenants.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma loja cadastrada ainda.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-3">Loja</th>
                      <th className="py-2 pr-3">Plano</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Uso (mês)</th>
                      <th className="py-2 pr-3">Mensal</th>
                      <th className="py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => {
                      const usage = usageByTenant.get(t.id);
                      return (
                        <tr key={t.id} className="border-b border-slate-100">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-slate-900">
                              {t.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              código{" "}
                              <span className="font-mono">{t.slug}</span>
                              {!t.active ? " · inativa" : ""}
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            {t.subscription
                              ? SUBSCRIPTION_PLAN_LABEL[t.subscription.plan]
                              : "—"}
                          </td>
                          <td className="py-3 pr-3">
                            {t.subscription
                              ? SUBSCRIPTION_STATUS_LABEL[t.subscription.status]
                              : "—"}
                          </td>
                          <td className="py-3 pr-3">
                            <div>{usage?.count ?? 0} vendas</div>
                            <div className="text-xs text-slate-500">
                              {t._count.users} users · {t._count.products} prod.
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            {formatBRL(t.subscription?.priceMonthly ?? 0)}
                          </td>
                          <td className="py-3">
                            <Link
                              href={`/plataforma/lojas/${t.id}`}
                              className="text-teal-700 hover:underline"
                            >
                              Gerenciar
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <CreateTenantForm />
        </div>
      </main>
    </div>
  );
}
