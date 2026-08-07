import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatformBilling } from "@/lib/platform-billing";
import {
  getAuthorizedPayment,
  getPreapproval,
  mapMpPreapprovalStatus,
  validatePlatformMpWebhookSignature,
} from "@/lib/mercadopago-subscriptions";

const notificationSchema = z.object({
  type: z.string().optional(),
  action: z.string().optional(),
  data: z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
});

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function syncPreapproval(preapprovalId: string, accessToken: string) {
  const preapproval = await getPreapproval(preapprovalId, accessToken);
  const sub = await prisma.subscription.findUnique({
    where: { mpPreapprovalId: preapprovalId },
    include: { tenant: true },
  });

  if (!sub) {
    // tenta pelo external_reference mafpdv:tenantId:PLAN
    const ref = String(preapproval.external_reference ?? "");
    const parts = ref.split(":");
    if ((parts[0] === "mafpdv" || parts[0] === "nexopdv") && parts[1]) {
      const byTenant = await prisma.subscription.findUnique({
        where: { tenantId: parts[1] },
        include: { tenant: true },
      });
      if (byTenant) {
        return applyPreapprovalToSubscription(byTenant.id, preapproval);
      }
    }
    return { ok: false, reason: "subscription_not_found" as const };
  }

  return applyPreapprovalToSubscription(sub.id, preapproval);
}

async function applyPreapprovalToSubscription(
  subscriptionId: string,
  preapproval: Awaited<ReturnType<typeof getPreapproval>>,
) {
  const mapped = mapMpPreapprovalStatus(preapproval.status);
  const amount = Number(preapproval.auto_recurring?.transaction_amount ?? 0);

  const data: {
    mpStatus: string;
    mpPreapprovalId: string;
    mpInitPoint?: string | null;
    status?: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "PAST_DUE" | "TRIALING";
    priceMonthly?: number;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  } = {
    mpStatus: preapproval.status,
    mpPreapprovalId: preapproval.id,
    mpInitPoint: preapproval.init_point ?? undefined,
  };

  if (mapped) {
    data.status = mapped;
  }
  if (amount > 0) data.priceMonthly = amount;

  const existing = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscriptionId },
  });

  if (mapped === "ACTIVE") {
    data.currentPeriodStart = new Date();
    data.currentPeriodEnd = addMonths(new Date(), 1);
    await prisma.tenant.update({
      where: { id: existing.tenantId },
      data: { active: true },
    });
  }

  if (mapped === "CANCELLED") {
    await prisma.tenant.update({
      where: { id: existing.tenantId },
      data: { active: false },
    });
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data,
    include: { tenant: true },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: updated.tenantId,
      action: "MP_ASSINATURA_SYNC",
      detail: `Preapproval ${preapproval.id} → ${preapproval.status} (local: ${updated.status})`,
    },
  });

  revalidatePath("/plataforma");
  revalidatePath(`/plataforma/lojas/${updated.tenantId}`);
  revalidatePath("/assinatura");

  return {
    ok: true as const,
    subscriptionId: updated.id,
    mpStatus: preapproval.status,
    localStatus: updated.status,
  };
}

async function syncAuthorizedPayment(invoiceId: string, accessToken: string) {
  const invoice = await getAuthorizedPayment(invoiceId, accessToken);
  const preapprovalId = invoice.preapproval_id;
  if (!preapprovalId) {
    return { ok: false, reason: "missing_preapproval" as const };
  }

  const sub = await prisma.subscription.findUnique({
    where: { mpPreapprovalId: preapprovalId },
  });
  if (!sub) {
    // ainda assim tenta sync do preapproval
    await syncPreapproval(preapprovalId, accessToken);
    const again = await prisma.subscription.findUnique({
      where: { mpPreapprovalId: preapprovalId },
    });
    if (!again) return { ok: false, reason: "subscription_not_found" as const };
    return recordInvoice(again.id, invoice);
  }

  return recordInvoice(sub.id, invoice);
}

async function recordInvoice(
  subscriptionId: string,
  invoice: Awaited<ReturnType<typeof getAuthorizedPayment>>,
) {
  const amount = Number(invoice.transaction_amount ?? 0);
  const paymentStatus = invoice.payment?.status ?? invoice.status ?? "unknown";
  const summarized = invoice.summarized ?? null;
  const mpId = String(invoice.id);

  await prisma.subscriptionPayment.upsert({
    where: { mpAuthorizedPaymentId: mpId },
    create: {
      subscriptionId,
      mpAuthorizedPaymentId: mpId,
      mpPaymentId: invoice.payment?.id ? String(invoice.payment.id) : null,
      amount,
      status: paymentStatus,
      summarized,
      debitDate: invoice.debit_date ? new Date(invoice.debit_date) : null,
      rawDetail: invoice.payment?.status_detail ?? null,
    },
    update: {
      status: paymentStatus,
      summarized,
      mpPaymentId: invoice.payment?.id ? String(invoice.payment.id) : null,
      amount,
    },
  });

  const approved =
    paymentStatus === "approved" ||
    summarized === "ok" ||
    summarized === "processed";

  const failed =
    paymentStatus === "rejected" ||
    paymentStatus === "cancelled" ||
    summarized === "rejected";

  if (approved) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        lastPaymentAt: new Date(),
        lastPaymentAmount: amount,
        currentPeriodStart: new Date(),
        currentPeriodEnd: addMonths(new Date(), 1),
        mpStatus: "authorized",
      },
    });
    const sub = await prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
    });
    await prisma.tenant.update({
      where: { id: sub.tenantId },
      data: { active: true },
    });
  } else if (failed) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "PAST_DUE" },
    });
  }

  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscriptionId },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: sub.tenantId,
      action: "MP_COBRANCA",
      detail: `Fatura ${mpId}: ${paymentStatus} R$ ${amount.toFixed(2)}`,
    },
  });

  revalidatePath("/plataforma");
  revalidatePath(`/plataforma/lojas/${sub.tenantId}`);
  revalidatePath("/assinatura");

  return {
    ok: true as const,
    subscriptionId,
    invoiceId: mpId,
    paymentStatus,
  };
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const queryId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const queryType = url.searchParams.get("type") ?? url.searchParams.get("topic");

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = notificationSchema.safeParse(body);
  const bodyId = parsed.success ? parsed.data.data?.id : undefined;
  const dataId = (queryId ?? bodyId)?.toString() ?? null;
  const type =
    queryType ?? (parsed.success ? parsed.data.type : undefined) ?? undefined;

  const billing = await getPlatformBilling();
  if (!billing.mpAccessToken) {
    return NextResponse.json(
      { error: "Cobrança Mercado Pago não configurada." },
      { status: 503 },
    );
  }

  const valid = validatePlatformMpWebhookSignature(
    request.headers.get("x-signature"),
    request.headers.get("x-request-id"),
    dataId,
    billing.mpWebhookSecret,
  );
  if (!valid) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  if (!dataId) {
    return NextResponse.json({ ok: true, message: "Notificação recebida." });
  }

  try {
    if (
      type === "subscription_preapproval" ||
      type === "subscription_preapproval_plan" ||
      type === "preapproval"
    ) {
      if (type === "subscription_preapproval_plan") {
        return NextResponse.json({ ok: true, ignored: true, type });
      }
      const result = await syncPreapproval(dataId, billing.mpAccessToken);
      return NextResponse.json(result);
    }

    if (
      type === "subscription_authorized_payment" ||
      type === "authorized_payment"
    ) {
      const result = await syncAuthorizedPayment(dataId, billing.mpAccessToken);
      return NextResponse.json(result);
    }

    // Sem type: tenta preapproval depois fatura
    try {
      const result = await syncPreapproval(dataId, billing.mpAccessToken);
      return NextResponse.json(result);
    } catch {
      const result = await syncAuthorizedPayment(dataId, billing.mpAccessToken);
      return NextResponse.json(result);
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Falha ao processar webhook de assinatura.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    provider: "mercadopago_subscriptions",
    status: "ready",
    webhook: "/api/assinaturas/mercadopago/webhook",
    topics: ["subscription_preapproval", "subscription_authorized_payment"],
  });
}
