import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createPendingPreapproval,
  createPreapprovalPlan,
  planReason,
} from "@/lib/mercadopago-subscriptions";
import { APP_NAME } from "@/lib/constants";

export type PlatformBilling = {
  mpAccessToken: string;
  mpWebhookSecret: string;
  basicPrice: number;
  proPrice: number;
  mpPlanBasicId: string | null;
  mpPlanBasicPrice: number | null;
  mpPlanProId: string | null;
  mpPlanProPrice: number | null;
};

const DEFAULTS = {
  basicPrice: 79.9,
  proPrice: 149.9,
};

export async function getPlatformBilling(): Promise<PlatformBilling> {
  const envToken = process.env.PLATFORM_MP_ACCESS_TOKEN?.trim() ?? "";
  const envSecret = process.env.PLATFORM_MP_WEBHOOK_SECRET?.trim() ?? "";

  let row = null;
  try {
    row = await prisma.platformBillingSettings.findUnique({
      where: { id: "default" },
    });
  } catch {
    row = null;
  }

  return {
    mpAccessToken: row?.mpAccessToken?.trim() || envToken,
    mpWebhookSecret: row?.mpWebhookSecret?.trim() || envSecret,
    basicPrice: row?.basicPrice ?? DEFAULTS.basicPrice,
    proPrice: row?.proPrice ?? DEFAULTS.proPrice,
    mpPlanBasicId: row?.mpPlanBasicId ?? null,
    mpPlanBasicPrice: row?.mpPlanBasicPrice ?? null,
    mpPlanProId: row?.mpPlanProId ?? null,
    mpPlanProPrice: row?.mpPlanProPrice ?? null,
  };
}

export function isPlatformBillingConfigured(billing: PlatformBilling): boolean {
  return Boolean(billing.mpAccessToken);
}

export function priceForPlan(
  billing: PlatformBilling,
  plan: SubscriptionPlan,
): number {
  if (plan === "PRO") return billing.proPrice;
  if (plan === "BASIC") return billing.basicPrice;
  return 0;
}

/** Garante plano MP sincronizado com o preço local (recria se mudou). */
export async function ensureMpPlan(
  plan: "BASIC" | "PRO",
  backUrl: string,
): Promise<{ planId: string; amount: number }> {
  const billing = await getPlatformBilling();
  if (!billing.mpAccessToken) {
    throw new Error(
      "Configure o Access Token do Mercado Pago em Plataforma → Cobrança.",
    );
  }

  const amount = plan === "PRO" ? billing.proPrice : billing.basicPrice;
  const cachedId =
    plan === "PRO" ? billing.mpPlanProId : billing.mpPlanBasicId;
  const cachedPrice =
    plan === "PRO" ? billing.mpPlanProPrice : billing.mpPlanBasicPrice;

  if (cachedId && cachedPrice != null && Math.abs(cachedPrice - amount) < 0.001) {
    return { planId: cachedId, amount };
  }

  const created = await createPreapprovalPlan({
    accessToken: billing.mpAccessToken,
    reason: planReason(plan),
    amount,
    backUrl,
  });

  await prisma.platformBillingSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      mpAccessToken: billing.mpAccessToken || null,
      mpWebhookSecret: billing.mpWebhookSecret || null,
      basicPrice: billing.basicPrice,
      proPrice: billing.proPrice,
      ...(plan === "PRO"
        ? { mpPlanProId: created.id, mpPlanProPrice: amount }
        : { mpPlanBasicId: created.id, mpPlanBasicPrice: amount }),
    },
    update:
      plan === "PRO"
        ? { mpPlanProId: created.id, mpPlanProPrice: amount }
        : { mpPlanBasicId: created.id, mpPlanBasicPrice: amount },
  });

  return { planId: created.id, amount };
}

export function buildExternalReference(
  tenantId: string,
  plan: "BASIC" | "PRO",
): string {
  return `nexopdv:${tenantId}:${plan}`;
}

export function parseExternalReference(
  ref: string | undefined | null,
): { tenantId: string; plan: "BASIC" | "PRO" } | null {
  if (!ref) return null;
  const parts = String(ref).split(":");
  if (parts.length !== 3 || parts[0] !== "nexopdv") return null;
  if (parts[2] !== "BASIC" && parts[2] !== "PRO") return null;
  return { tenantId: parts[1], plan: parts[2] };
}

export async function startMercadoPagoCheckout(input: {
  tenantId: string;
  plan: "BASIC" | "PRO";
  payerEmail: string;
  backUrl: string;
  freeTrialDays?: number;
}) {
  const billing = await getPlatformBilling();
  if (!billing.mpAccessToken) {
    throw new Error(
      "Configure o Access Token do Mercado Pago em Plataforma → Cobrança.",
    );
  }

  const email = input.payerEmail.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Informe um e-mail válido do pagador.");
  }

  const { planId, amount } = await ensureMpPlan(input.plan, input.backUrl);
  const reason = planReason(input.plan);
  const externalReference = buildExternalReference(input.tenantId, input.plan);

  const preapproval = await createPendingPreapproval({
    accessToken: billing.mpAccessToken,
    reason,
    externalReference,
    payerEmail: email,
    amount,
    backUrl: input.backUrl,
    preapprovalPlanId: planId,
    freeTrialDays: input.freeTrialDays,
  });

  if (!preapproval.init_point) {
    throw new Error(
      "Mercado Pago não retornou o link de checkout (init_point).",
    );
  }

  const subscription = await prisma.subscription.upsert({
    where: { tenantId: input.tenantId },
    create: {
      tenantId: input.tenantId,
      plan: input.plan,
      status: "TRIALING",
      priceMonthly: amount,
      payerEmail: email,
      mpPreapprovalId: preapproval.id,
      mpPreapprovalPlanId: planId,
      mpStatus: preapproval.status,
      mpInitPoint: preapproval.init_point,
      currentPeriodStart: new Date(),
      notes: `Checkout ${APP_NAME} via Mercado Pago`,
    },
    update: {
      plan: input.plan,
      priceMonthly: amount,
      payerEmail: email,
      mpPreapprovalId: preapproval.id,
      mpPreapprovalPlanId: planId,
      mpStatus: preapproval.status,
      mpInitPoint: preapproval.init_point,
    },
  });

  return {
    subscription,
    initPoint: preapproval.init_point,
    preapprovalId: preapproval.id,
    amount,
  };
}
