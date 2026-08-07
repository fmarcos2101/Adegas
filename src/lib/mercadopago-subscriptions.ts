import { createHmac, timingSafeEqual } from "node:crypto";
import type { SubscriptionPlan } from "@prisma/client";
import { APP_NAME } from "@/lib/constants";

const MP_API = "https://api.mercadopago.com";

export type MpPreapprovalPlan = {
  id: string;
  status?: string;
  reason?: string;
  init_point?: string;
  auto_recurring?: {
    frequency?: number;
    frequency_type?: string;
    transaction_amount?: number;
    currency_id?: string;
  };
};

export type MpPreapproval = {
  id: string;
  status: string;
  reason?: string;
  external_reference?: string;
  init_point?: string;
  payer_email?: string;
  preapproval_plan_id?: string;
  next_payment_date?: string;
  auto_recurring?: {
    frequency?: number;
    frequency_type?: string;
    transaction_amount?: number | string;
    currency_id?: string;
  };
};

export type MpAuthorizedPayment = {
  id: number | string;
  preapproval_id?: string;
  external_reference?: string | number;
  transaction_amount?: number | string;
  debit_date?: string;
  status?: string;
  summarized?: string;
  payment?: {
    id?: number | string;
    status?: string;
    status_detail?: string;
  };
};

async function mpFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
    cause?: Array<{ description?: string }>;
  };

  if (!res.ok) {
    const detail =
      body.message ??
      body.error ??
      body.cause?.[0]?.description ??
      `Erro Mercado Pago (${res.status})`;
    throw new Error(detail);
  }

  return body;
}

export function planReason(plan: Exclude<SubscriptionPlan, "TRIAL">): string {
  if (plan === "PLUS") return `${APP_NAME} Plus`;
  if (plan === "PRO") return `${APP_NAME} Pro`;
  return `${APP_NAME} Básico`;
}

/** Cria (ou recria) um plano mensal no Mercado Pago. */
export async function createPreapprovalPlan(input: {
  accessToken: string;
  reason: string;
  amount: number;
  backUrl: string;
}): Promise<MpPreapprovalPlan> {
  return mpFetch<MpPreapprovalPlan>("/preapproval_plan", input.accessToken, {
    method: "POST",
    body: JSON.stringify({
      reason: input.reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(input.amount.toFixed(2)),
        currency_id: "BRL",
      },
      payment_methods_allowed: {
        payment_types: [{ id: "credit_card" }],
        payment_methods: [],
      },
      back_url: input.backUrl,
      status: "active",
    }),
  });
}

/**
 * Cria assinatura em status pending — retorna init_point para o cliente
 * autorizar o cartão no checkout do Mercado Pago.
 */
export async function createPendingPreapproval(input: {
  accessToken: string;
  reason: string;
  externalReference: string;
  payerEmail: string;
  amount: number;
  backUrl: string;
  preapprovalPlanId?: string;
  freeTrialDays?: number;
}): Promise<MpPreapproval> {
  const autoRecurring: Record<string, unknown> = {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: Number(input.amount.toFixed(2)),
    currency_id: "BRL",
  };

  if (input.freeTrialDays && input.freeTrialDays > 0) {
    autoRecurring.free_trial = {
      frequency: input.freeTrialDays,
      frequency_type: "days",
    };
  }

  const payload: Record<string, unknown> = {
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    status: "pending",
    auto_recurring: autoRecurring,
  };

  if (input.preapprovalPlanId) {
    payload.preapproval_plan_id = input.preapprovalPlanId;
  }

  return mpFetch<MpPreapproval>("/preapproval", input.accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPreapproval(
  id: string,
  accessToken: string,
): Promise<MpPreapproval> {
  return mpFetch<MpPreapproval>(`/preapproval/${id}`, accessToken);
}

export async function cancelPreapproval(
  id: string,
  accessToken: string,
): Promise<MpPreapproval> {
  return mpFetch<MpPreapproval>(`/preapproval/${id}`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export async function pausePreapproval(
  id: string,
  accessToken: string,
): Promise<MpPreapproval> {
  return mpFetch<MpPreapproval>(`/preapproval/${id}`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ status: "paused" }),
  });
}

export async function getAuthorizedPayment(
  id: string,
  accessToken: string,
): Promise<MpAuthorizedPayment> {
  return mpFetch<MpAuthorizedPayment>(`/authorized_payments/${id}`, accessToken);
}

export function mapMpPreapprovalStatus(
  mpStatus: string | undefined | null,
): "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED" | "TRIALING" | null {
  switch ((mpStatus ?? "").toLowerCase()) {
    case "authorized":
      return "ACTIVE";
    case "pending":
      return null; // mantém status local até autorizar
    case "paused":
      return "SUSPENDED";
    case "cancelled":
      return "CANCELLED";
    default:
      return null;
  }
}

const WEBHOOK_MAX_AGE_SECONDS = 5 * 60;

/**
 * Sem segredo configurado, a validação FALHA (fail closed). Também rejeita
 * timestamps fora de uma janela curta para dificultar replay.
 */
export function validatePlatformMpWebhookSignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string | null,
  webhookSecret?: string | null,
): boolean {
  const secret = webhookSecret?.trim();
  if (!secret) return false;
  if (!signatureHeader || !requestId || !dataId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const tsSeconds = Number(ts);
  if (
    !Number.isFinite(tsSeconds) ||
    Math.abs(Date.now() / 1000 - tsSeconds) > WEBHOOK_MAX_AGE_SECONDS
  ) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const PLATFORM_MP_WEBHOOK_PATH = "/api/assinaturas/mercadopago/webhook";
