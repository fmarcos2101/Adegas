import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PlatformShell } from "@/components/plataforma/platform-shell";
import { StatusBadge } from "@/components/plataforma/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import {
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/constants";
import {
  enterTenantSupportAction,
  setTenantActiveAction,
} from "../../actions";
import { SubscriptionForm } from "./subscription-form";
import { MpCheckoutForm } from "./mp-checkout-form";
import { PlatformUsersPanel } from "./platform-users-panel";
import { TenantProfileForm } from "./tenant-profile-form";
import { DeleteTenantForm } from "./delete-tenant-form";
import {
  getPlatformBilling,
  isPlatformBillingConfigured,
} from "@/lib/platform-billing";
import { getPdvUsage } from "@/lib/plan-limits";
import { trialDaysRemaining } from "@/lib/trial";

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
  const [monthSales, totalRevenue, billing, recentPayments, pdvUsage] =
    await Promise.all([
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
      getPdvUsage(tenant.id),
    ]);

  const sub = tenant.subscription;
  const trialLeft = trialDaysRemaining(sub?.trialEndsAt);

  return (
    <PlatformShell
      userName={session.name}
      subtitle={`Cliente · ${tenant.name}`}
      activePath="/plataforma"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/plataforma"
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-800 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos clientes
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-zinc-900">
              {tenant.name}
            </h1>
            {sub ? (
              <StatusBadge
                status={sub.status}
                label={SUBSCRIPTION_STATUS_LABEL[sub.status]}
              />
            ) : null}
            {!tenant.active ? (
              <StatusBadge status="SUSPENDED" label="Loja inativa" />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Código: <span className="font-mono font-medium">{tenant.slug}</span>
            {sub?.status === "TRIALING" && sub.trialEndsAt ? (
              <>
                {" "}
                · trial {trialLeft} dia(s) · até{" "}
                {sub.trialEndsAt.toLocaleDateString("pt-BR")}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form
            action={setTenantActiveAction.bind(null, tenant.id, !tenant.active)}
          >
            <Button type="submit" variant="outline">
              {tenant.active ? "Suspender loja" : "Reativar loja"}
            </Button>
          </form>
          <form action={enterTenantSupportAction.bind(null, tenant.id)}>
            <Button type="submit" className="bg-zinc-100 hover:bg-white">
              Entrar como suporte
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Vendas no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthSales._count}</div>
            <p className="text-xs text-zinc-400">
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
            <p className="text-xs text-zinc-400">
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
            <p className="text-xs text-zinc-400">
              {tenant.users.length} usuários · {tenant._count.categories}{" "}
              categorias · PDV {pdvUsage.used}/{pdvUsage.max}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TenantProfileForm
          tenantId={tenant.id}
          name={tenant.name}
          notes={tenant.notes ?? ""}
          slug={tenant.slug}
          trialEndsAtLabel={
            sub?.trialEndsAt
              ? sub.trialEndsAt.toLocaleDateString("pt-BR")
              : null
          }
          createdAtLabel={tenant.createdAt.toLocaleDateString("pt-BR")}
        />

        <SubscriptionForm
          tenantId={tenant.id}
          active={tenant.active}
          plan={sub?.plan ?? "TRIAL"}
          status={sub?.status ?? "TRIALING"}
          priceMonthly={sub?.priceMonthly ?? 0}
          notes={sub?.notes ?? ""}
          planLabel={sub ? SUBSCRIPTION_PLAN_LABEL[sub.plan] : "—"}
          statusLabel={sub ? SUBSCRIPTION_STATUS_LABEL[sub.status] : "—"}
        />
      </div>

      <MpCheckoutForm
        tenantId={tenant.id}
        defaultPlan={
          sub?.plan === "PLUS" || sub?.plan === "PRO" ? sub.plan : "BASIC"
        }
        payerEmail={sub?.payerEmail ?? ""}
        mpInitPoint={sub?.mpInitPoint ?? null}
        mpStatus={sub?.mpStatus ?? null}
        mpPreapprovalId={sub?.mpPreapprovalId ?? null}
        billingConfigured={isPlatformBillingConfigured(billing)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Cobranças Mercado Pago</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Nenhuma cobrança registrada ainda para esta loja.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-400">
                  <th className="py-2">Data</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100">
                    <td className="py-2">
                      {p.createdAt.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2">{formatBRL(p.amount)}</td>
                    <td className="py-2">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <PlatformUsersPanel
        tenantId={tenant.id}
        users={tenant.users.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          active: u.active,
        }))}
        pdvUsed={pdvUsage.used}
        pdvMax={pdvUsage.max}
        planLabel={sub ? SUBSCRIPTION_PLAN_LABEL[sub.plan] : "—"}
      />

      <DeleteTenantForm
        tenantId={tenant.id}
        slug={tenant.slug}
        name={tenant.name}
      />
    </PlatformShell>
  );
}
