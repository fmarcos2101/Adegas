import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import {
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/constants";
import { enterTenantSupportAction } from "../../actions";
import { SubscriptionForm } from "./subscription-form";
import { MpCheckoutForm } from "./mp-checkout-form";
import {
  getPlatformBilling,
  isPlatformBillingConfigured,
} from "@/lib/platform-billing";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.isPlatformAdmin) redirect("/login");

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      subscription: true,
      users: { orderBy: { createdAt: "asc" } },
      _count: { select: { products: true, sales: true, categories: true } },
    },
  });
  if (!tenant) notFound();

  const monthStart = startOfMonth();
  const [monthSales, totalRevenue, billing, recentPayments] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        tenantId: tenant.id,
        status: "CONCLUIDA",
        createdAt: { gte: monthStart },
      },
      _count: true,
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { tenantId: tenant.id, status: "CONCLUIDA" },
      _sum: { total: true },
      _count: true,
    }),
    getPlatformBilling(),
    prisma.subscriptionPayment.findMany({
      where: { subscription: { tenantId: tenant.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <BrandHeader subtitle={`Cliente · ${tenant.name}`} />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/plataforma"
              className="mb-2 inline-flex items-center gap-1 text-sm text-teal-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">
              {tenant.name}
            </h1>
            <p className="text-sm text-slate-500">
              Código de acesso:{" "}
              <span className="font-mono font-medium">{tenant.slug}</span>
            </p>
          </div>
          <form action={enterTenantSupportAction.bind(null, tenant.id)}>
            <Button type="submit" className="bg-teal-700 hover:bg-teal-600">
              Entrar como suporte
            </Button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Vendas no mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthSales._count}</div>
              <p className="text-xs text-slate-500">
                {formatBRL(monthSales._sum.total ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue._count}</div>
              <p className="text-xs text-slate-500">
                {formatBRL(totalRevenue._sum.total ?? 0)} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cadastros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenant._count.products}</div>
              <p className="text-xs text-slate-500">
                {tenant.users.length} usuários · {tenant._count.categories}{" "}
                categorias
              </p>
            </CardContent>
          </Card>
        </div>

        <SubscriptionForm
          tenantId={tenant.id}
          active={tenant.active}
          plan={tenant.subscription?.plan ?? "TRIAL"}
          status={tenant.subscription?.status ?? "TRIALING"}
          priceMonthly={tenant.subscription?.priceMonthly ?? 0}
          notes={tenant.subscription?.notes ?? ""}
          planLabel={
            tenant.subscription
              ? SUBSCRIPTION_PLAN_LABEL[tenant.subscription.plan]
              : "—"
          }
          statusLabel={
            tenant.subscription
              ? SUBSCRIPTION_STATUS_LABEL[tenant.subscription.status]
              : "—"
          }
        />

        <MpCheckoutForm
          tenantId={tenant.id}
          defaultPlan={
            tenant.subscription?.plan === "PRO" ? "PRO" : "BASIC"
          }
          payerEmail={tenant.subscription?.payerEmail ?? ""}
          mpInitPoint={tenant.subscription?.mpInitPoint ?? null}
          mpStatus={tenant.subscription?.mpStatus ?? null}
          mpPreapprovalId={tenant.subscription?.mpPreapprovalId ?? null}
          billingConfigured={isPlatformBillingConfigured(billing)}
        />

        {recentPayments.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Cobranças Mercado Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2">Data</th>
                    <th className="py-2">Valor</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2">
                        {p.createdAt.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2">{formatBRL(p.amount)}</td>
                      <td className="py-2">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Usuários da loja</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2">Nome</th>
                  <th className="py-2">Usuário</th>
                  <th className="py-2">Perfil</th>
                  <th className="py-2">Ativo</th>
                </tr>
              </thead>
              <tbody>
                {tenant.users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2 font-mono text-xs">{u.username}</td>
                    <td className="py-2">{u.role}</td>
                    <td className="py-2">{u.active ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
