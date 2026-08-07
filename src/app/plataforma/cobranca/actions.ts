"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/tenant";
import {
  getPlatformBilling,
  startMercadoPagoCheckout,
} from "@/lib/platform-billing";
import {
  cancelPreapproval,
  PLATFORM_MP_WEBHOOK_PATH,
} from "@/lib/mercadopago-subscriptions";
import { getTerminalApiPort } from "@/lib/payment-terminal";
import { isTrialStillValid, trialDaysRemaining } from "@/lib/trial";

export type BillingActionState = { error?: string; success?: string };

async function resolveBaseUrl() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return `http://localhost:${getTerminalApiPort()}`;
}

export async function saveBillingSettingsAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  await requirePlatformAdmin();

  const schema = z.object({
    mpAccessToken: z.string().optional(),
    mpWebhookSecret: z.string().optional(),
    basicPrice: z.coerce.number().min(0),
    proPrice: z.coerce.number().min(0),
  });

  const parsed = schema.safeParse({
    mpAccessToken: formData.get("mpAccessToken") || undefined,
    mpWebhookSecret: formData.get("mpWebhookSecret") || undefined,
    basicPrice: formData.get("basicPrice"),
    proPrice: formData.get("proPrice"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const existing = await prisma.platformBillingSettings.findUnique({
    where: { id: "default" },
  });

  // Campos vazios preservam o valor atual (não apagam o token)
  const token =
    data.mpAccessToken?.trim() || existing?.mpAccessToken || null;
  const secret =
    data.mpWebhookSecret?.trim() || existing?.mpWebhookSecret || null;

  const priceChanged =
    !existing ||
    existing.basicPrice !== data.basicPrice ||
    existing.proPrice !== data.proPrice;

  await prisma.platformBillingSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      mpAccessToken: token,
      mpWebhookSecret: secret,
      basicPrice: data.basicPrice,
      proPrice: data.proPrice,
    },
    update: {
      mpAccessToken: token,
      mpWebhookSecret: secret,
      basicPrice: data.basicPrice,
      proPrice: data.proPrice,
      // invalida planos cacheados se preço mudou
      ...(priceChanged
        ? {
            mpPlanBasicId: null,
            mpPlanBasicPrice: null,
            mpPlanProId: null,
            mpPlanProPrice: null,
          }
        : {}),
    },
  });

  revalidatePath("/plataforma/cobranca");
  revalidatePath("/plataforma");
  return { success: "Configuração de cobrança salva." };
}

export async function generateCheckoutLinkAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const session = await requirePlatformAdmin();

  const tenantId = String(formData.get("tenantId") ?? "");
  const plan = String(formData.get("plan") ?? "BASIC");
  const payerEmail = String(formData.get("payerEmail") ?? "").trim();
  const freeTrialDaysRaw = formData.get("freeTrialDays");
  const freeTrialDaysInput =
    freeTrialDaysRaw === null || freeTrialDaysRaw === ""
      ? null
      : Number(freeTrialDaysRaw);

  if (!tenantId) return { error: "Loja inválida." };
  if (plan !== "BASIC" && plan !== "PLUS" && plan !== "PRO") {
    return { error: "Selecione o plano Básico, Plus ou Pro." };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });
  if (!tenant) return { error: "Loja não encontrada." };

  // Default: dias restantes do trial (ou 7 se ainda não começou a contar no MP)
  let freeTrialDays: number | undefined;
  if (
    freeTrialDaysInput != null &&
    Number.isFinite(freeTrialDaysInput) &&
    freeTrialDaysInput >= 0
  ) {
    freeTrialDays =
      freeTrialDaysInput > 0 ? freeTrialDaysInput : undefined;
  } else if (
    tenant.subscription &&
    isTrialStillValid(tenant.subscription)
  ) {
    freeTrialDays = Math.max(
      1,
      trialDaysRemaining(tenant.subscription.trialEndsAt),
    );
  }

  try {
    const baseUrl = await resolveBaseUrl();
    const result = await startMercadoPagoCheckout({
      tenantId,
      plan,
      payerEmail,
      backUrl: `${baseUrl}/assinatura/retorno`,
      freeTrialDays,
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.userId,
        action: "MP_CHECKOUT_CRIADO",
        detail: `Link ${plan} R$ ${result.amount.toFixed(2)} → ${payerEmail}`,
      },
    });

    revalidatePath(`/plataforma/lojas/${tenantId}`);
    revalidatePath("/assinatura");
    return {
      success: `Link gerado. Envie ao cliente: ${result.initPoint}`,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao gerar link.",
    };
  }
}

export async function cancelMpSubscriptionAction(
  tenantId: string,
): Promise<BillingActionState> {
  const session = await requirePlatformAdmin();
  const billing = await getPlatformBilling();
  if (!billing.mpAccessToken) {
    return { error: "Mercado Pago não configurado." };
  }

  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub?.mpPreapprovalId) {
    return { error: "Esta loja não tem assinatura Mercado Pago." };
  }

  try {
    await cancelPreapproval(sub.mpPreapprovalId, billing.mpAccessToken);
    await prisma.subscription.update({
      where: { tenantId },
      data: { status: "CANCELLED", mpStatus: "cancelled" },
    });
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { active: false },
    });
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.userId,
        action: "MP_ASSINATURA_CANCELADA",
        detail: `Preapproval ${sub.mpPreapprovalId} cancelado`,
      },
    });
    revalidatePath(`/plataforma/lojas/${tenantId}`);
    revalidatePath("/plataforma");
    return {
      success:
        "Assinatura cancelada no Mercado Pago. A loja foi bloqueada, mas os dados foram mantidos.",
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao cancelar.",
    };
  }
}

export async function getBillingWebhookUrl(): Promise<string> {
  const base = await resolveBaseUrl();
  return `${base}${PLATFORM_MP_WEBHOOK_PATH}`;
}
