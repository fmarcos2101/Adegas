"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantSession } from "@/lib/tenant";
import { startMercadoPagoCheckout } from "@/lib/platform-billing";
import { getTerminalApiPort } from "@/lib/payment-terminal";
import { isTrialStillValid, trialDaysRemaining } from "@/lib/trial";

export type AssinaturaState = { error?: string; success?: string; initPoint?: string };

async function resolveBaseUrl() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return `http://localhost:${getTerminalApiPort()}`;
}

export async function startTenantCheckoutAction(
  _prev: AssinaturaState,
  formData: FormData,
): Promise<AssinaturaState> {
  const session = await requireTenantSession();
  if (session.role !== "ADMIN") {
    return { error: "Apenas o administrador da loja pode assinar." };
  }

  const plan = String(formData.get("plan") ?? "BASIC");
  const payerEmail = String(formData.get("payerEmail") ?? "").trim();
  if (plan !== "BASIC" && plan !== "PRO") {
    return { error: "Selecione Básico ou Pro." };
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { tenantId: session.tenantId },
    });
    // Se ainda está no trial, o MP só cobra após os dias restantes
    const freeTrialDays =
      sub && isTrialStillValid(sub)
        ? Math.max(1, trialDaysRemaining(sub.trialEndsAt))
        : undefined;

    const baseUrl = await resolveBaseUrl();
    const result = await startMercadoPagoCheckout({
      tenantId: session.tenantId,
      plan,
      payerEmail,
      backUrl: `${baseUrl}/assinatura/retorno`,
      freeTrialDays,
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: "MP_CHECKOUT_LOJA",
        detail: `Checkout ${plan} iniciado por ${session.username}`,
      },
    });

    revalidatePath("/assinatura");
    return {
      success: "Link gerado. Clique para pagar no Mercado Pago.",
      initPoint: result.initPoint,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao iniciar assinatura.",
    };
  }
}
