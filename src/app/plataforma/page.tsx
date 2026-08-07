import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PlatformShell } from "@/components/plataforma/platform-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTenantForm } from "./create-tenant-form";
import { TenantsTable, type TenantRow } from "./tenants-table";
import {
  APP_NAME,
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import { trialDaysRemaining } from "@/lib/trial";

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

  const pastDue = tenants.filter((t) => t.subscription?.status === "PAST_DUE");
  const trialEnding = tenants.filter((t) => {
    if (t.subscription?.status !== "TRIALING") return false;
    return trialDaysRemaining(t.subscription.trialEndsAt) <= 3;
  });
  const suspended = tenants.filter(
    (t) => !t.active || t.subscription?.status === "SUSPENDED",
  );

  const rows: TenantRow[] = tenants.map((t) => {
    const usage = usageByTenant.get(t.id);
    const status = t.subscription?.status ?? null;
    const trialEndingSoon =
      status === "TRIALING" &&
      trialDaysRemaining(t.subscription?.trialEndsAt) <= 3;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      active: t.active,
      notes: t.notes,
      plan: t.subscription?.plan ?? null,
      planLabel: t.subscription
        ? SUBSCRIPTION_PLAN_LABEL[t.subscription.plan]
        : "—",
      status,
      statusLabel: t.subscription
        ? SUBSCRIPTION_STATUS_LABEL[t.subscription.status]
        : "—",
      priceMonthly: t.subscription?.priceMonthly ?? 0,
      trialEndsAt: t.subscription?.trialEndsAt?.toISOString() ?? null,
      payerEmail: t.subscription?.payerEmail ?? null,
      users: t._count.users,
      products: t._count.products,
      monthSales: usage?.count ?? 0,
      monthRevenue: usage?.revenue ?? 0,
      needsAttention:
        !t.active ||
        status === "PAST_DUE" ||
        status === "SUSPENDED" ||
        trialEndingSoon,
    };
  });

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
      value: String(salesThisMonth.reduce((a, s) => a + s._count, 0)),
      icon: ShoppingCart,
    },
  ];

  return (
    <PlatformShell userName={session.name} activePath="/plataforma">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Seu painel — {APP_NAME}
          </h1>
          <p className="text-sm text-slate-500">
            Clientes, assinaturas, suporte e cobrança em um só lugar.
          </p>
        </div>
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
                <div className="text-2xl font-bold text-slate-900">{c.value}</div>
                {c.hint ? (
                  <p className="mt-1 text-xs text-slate-500">{c.hint}</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(pastDue.length > 0 || trialEnding.length > 0 || suspended.length > 0) && (
        <section className="grid gap-4 md:grid-cols-3">
          <AttentionCard
            title="Pagamento atrasado"
            icon={<AlertTriangle className="h-4 w-4 text-amber-700" />}
            items={pastDue.map((t) => ({
              id: t.id,
              label: t.name,
              hint: t.slug,
            }))}
            empty="Nenhuma loja atrasada."
          />
          <AttentionCard
            title="Trial acabando (≤3 dias)"
            icon={<Clock className="h-4 w-4 text-sky-700" />}
            items={trialEnding.map((t) => ({
              id: t.id,
              label: t.name,
              hint: t.subscription?.trialEndsAt
                ? `até ${t.subscription.trialEndsAt.toLocaleDateString("pt-BR")}`
                : t.slug,
            }))}
            empty="Nenhum trial crítico."
          />
          <AttentionCard
            title="Suspensas / inativas"
            icon={<AlertTriangle className="h-4 w-4 text-red-700" />}
            items={suspended.map((t) => ({
              id: t.id,
              label: t.name,
              hint: t.slug,
            }))}
            empty="Nenhuma loja suspensa."
          />
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma loja cadastrada ainda. Crie à direita ou espere o
                auto-cadastro em /cadastro.
              </p>
            ) : (
              <TenantsTable rows={rows} />
            )}
          </CardContent>
        </Card>

        <CreateTenantForm />
      </div>
    </PlatformShell>
  );
}

function AttentionCard({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; label: string; hint: string }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        {icon}
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/plataforma/lojas/${item.id}`}
                  className="block text-sm font-medium text-teal-800 hover:underline"
                >
                  {item.label}
                </Link>
                <p className="text-xs text-slate-500">{item.hint}</p>
              </li>
            ))}
            {items.length > 6 ? (
              <li className="text-xs text-slate-500">
                +{items.length - 6} outras
              </li>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
