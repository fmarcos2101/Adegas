import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireTenantSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getPlatformBilling } from "@/lib/platform-billing";
import { getPreapproval } from "@/lib/mercadopago-subscriptions";
import { Button } from "@/components/ui/button";
import {
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/constants";

export default async function AssinaturaRetornoPage() {
  const session = await requireTenantSession();
  const sub = await prisma.subscription.findUnique({
    where: { tenantId: session.tenantId },
  });

  // Tenta sincronizar status atual com o MP ao voltar do checkout
  if (sub?.mpPreapprovalId) {
    try {
      const billing = await getPlatformBilling();
      if (billing.mpAccessToken) {
        const pre = await getPreapproval(
          sub.mpPreapprovalId,
          billing.mpAccessToken,
        );
        const status =
          pre.status === "authorized"
            ? "ACTIVE"
            : pre.status === "cancelled"
              ? "CANCELLED"
              : pre.status === "paused"
                ? "SUSPENDED"
                : undefined;
        await prisma.subscription.update({
          where: { tenantId: session.tenantId },
          data: {
            mpStatus: pre.status,
            ...(status ? { status } : {}),
            ...(status === "ACTIVE"
              ? {
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: (() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 1);
                    return d;
                  })(),
                }
              : {}),
          },
        });
        if (status === "ACTIVE") {
          await prisma.tenant.update({
            where: { id: session.tenantId },
            data: { active: true },
          });
        }
      }
    } catch {
      // webhook ainda sincroniza depois
    }
  }

  const fresh = await prisma.subscription.findUnique({
    where: { tenantId: session.tenantId },
  });

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
      <CheckCircle2 className="h-12 w-12 text-teal-600" />
      <h1 className="text-2xl font-semibold text-neutral-900">
        Retorno do Mercado Pago
      </h1>
      <p className="text-sm text-neutral-500">
        {fresh?.mpStatus === "authorized" || fresh?.status === "ACTIVE"
          ? "Assinatura autorizada. A cobrança mensal está ativa."
          : "Recebemos seu retorno. Se o pagamento ainda estiver pendente, aguarde a confirmação do Mercado Pago (webhook)."}
      </p>
      {fresh ? (
        <p className="text-sm text-neutral-600">
          Plano {SUBSCRIPTION_PLAN_LABEL[fresh.plan]} ·{" "}
          {SUBSCRIPTION_STATUS_LABEL[fresh.status]}
          {fresh.mpStatus ? ` (MP: ${fresh.mpStatus})` : ""}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Link href="/assinatura">
          <Button variant="outline">Ver assinatura</Button>
        </Link>
        <Link href="/dashboard">
          <Button className="bg-teal-700 hover:bg-teal-600">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
