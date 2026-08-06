import { format } from "date-fns";
import { requireTenantSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  getPlatformBilling,
  isPlatformBillingConfigured,
} from "@/lib/platform-billing";
import {
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/constants";
import { AssinaturaCheckoutForm } from "./assinatura-form";

export default async function AssinaturaPage() {
  const session = await requireTenantSession();
  if (session.role !== "ADMIN") {
    return (
      <p className="text-sm text-neutral-500">
        Apenas o administrador da loja gerencia a assinatura.
      </p>
    );
  }

  const [sub, billing, payments] = await Promise.all([
    prisma.subscription.findUnique({ where: { tenantId: session.tenantId } }),
    getPlatformBilling(),
    prisma.subscriptionPayment.findMany({
      where: { subscription: { tenantId: session.tenantId } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Assinatura</h1>
        <p className="text-sm text-neutral-500">
          Cobrança automática via Mercado Pago
        </p>
      </div>

      <AssinaturaCheckoutForm
        basicPrice={billing.basicPrice}
        proPrice={billing.proPrice}
        currentPlan={
          sub ? SUBSCRIPTION_PLAN_LABEL[sub.plan] ?? sub.plan : "—"
        }
        currentStatus={
          sub ? SUBSCRIPTION_STATUS_LABEL[sub.status] ?? sub.status : "—"
        }
        payerEmail={sub?.payerEmail ?? ""}
        mpInitPoint={sub?.mpInitPoint ?? null}
        mpStatus={sub?.mpStatus ?? null}
        lastPaymentAt={
          sub?.lastPaymentAt
            ? format(sub.lastPaymentAt, "dd/MM/yyyy HH:mm")
            : null
        }
        lastPaymentAmount={sub?.lastPaymentAmount ?? null}
        billingConfigured={isPlatformBillingConfigured(billing)}
      />

      {payments.length > 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">
            Histórico de cobranças
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="py-2">Data</th>
                <th className="py-2">Valor</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100">
                  <td className="py-2">
                    {format(p.createdAt, "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="py-2">
                    {p.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="py-2">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
