import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPaymentSettings, type PaymentSettingsData } from "@/lib/payment-settings";
import {
  completePendingSaleByMpOrderId,
  completePendingSaleByRef,
} from "@/lib/complete-pending-sale";
import {
  getPointOrder,
  isMercadoPagoOrderApproved,
  mapMpTypeToMethod,
  validateMercadoPagoWebhookSignature,
  type MpOrder,
} from "@/lib/mercadopago-point";

const notificationSchema = z.object({
  type: z.string().optional(),
  action: z.string().optional(),
  data: z
    .object({
      id: z.string().optional(),
    })
    .optional(),
});

function revalidateSalePaths() {
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/estoque");
  revalidatePath("/relatorios");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Busca a venda pelo mpOrderId com pequenas tentativas: existe uma corrida
 * legítima entre a criação da order no Mercado Pago e a gravação do
 * mpOrderId na venda (ver createPendingTerminalSale). A notificação do MP
 * pode chegar antes dessa escrita terminar.
 */
async function findSaleByMpOrderIdWithRetry(dataId: string) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const sale = await prisma.sale.findUnique({ where: { mpOrderId: dataId } });
    if (sale) return sale;
    if (attempt < 3) await sleep(300);
  }
  return null;
}

function extractPaidAmount(order: MpOrder): number | null {
  const raw = order.transactions?.payments?.[0]?.amount;
  if (!raw) return null;
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : null;
}

async function processMercadoPagoOrder(
  order: MpOrder,
  tenantId: string,
) {
  const paymentRef = order.external_reference?.trim().toUpperCase();
  const paymentId = order.transactions?.payments?.[0]?.id;
  const method = mapMpTypeToMethod(order.config?.payment_method?.default_type);
  const paidAmount = extractPaidAmount(order);

  if (!isMercadoPagoOrderApproved(order.status)) {
    return { ok: true, ignored: true, orderStatus: order.status };
  }

  if (paymentRef) {
    // Garante que a referência realmente pertence a esta loja antes de
    // liberar a venda com as credenciais desta loja.
    const belongsToTenant = await prisma.sale.findFirst({
      where: { paymentRef, tenantId },
      select: { id: true },
    });
    if (belongsToTenant) {
      const result = await completePendingSaleByRef(paymentRef, {
        paymentSource: "MERCADOPAGO",
        terminalTxId: paymentId ?? order.id,
        method,
        paidAmount,
        auditAction: "VENDA_LIBERADA_MERCADOPAGO",
        auditDetail: `Venda liberada via Mercado Pago Point — ref ${paymentRef} order ${order.id}`,
      });
      if (result.found) {
        revalidateSalePaths();
        return { ok: true, saleId: result.saleId, status: "CONCLUIDA" };
      }
    }
  }

  const byOrder = await prisma.sale.findFirst({
    where: { mpOrderId: order.id, tenantId },
    select: { id: true },
  });
  if (byOrder) {
    const result = await completePendingSaleByMpOrderId(order.id, {
      paymentSource: "MERCADOPAGO",
      terminalTxId: paymentId ?? order.id,
      method,
      paidAmount,
      auditAction: "VENDA_LIBERADA_MERCADOPAGO",
      auditDetail: `Venda liberada via Mercado Pago Point — order ${order.id}`,
    });
    if (result.found) {
      revalidateSalePaths();
      return { ok: true, saleId: result.saleId, status: "CONCLUIDA" };
    }
  }

  return { ok: false, reason: "sale_not_found", orderId: order.id };
}

/**
 * Quando ainda não sabemos a qual loja a notificação pertence (venda não
 * encontrada por mpOrderId), tentamos identificar a loja correta consultando
 * a API do Mercado Pago com o token de cada loja com o provedor ativo. A API
 * só retorna a order para o token dono dela, então isso substitui o
 * fallback anterior (usar cegamente as credenciais da "primeira loja
 * encontrada"), que podia liberar/rejeitar vendas com credenciais erradas.
 */
async function resolveTenantByProbingCandidates(
  dataId: string,
  candidates: { tenantId: string; settings: PaymentSettingsData }[],
): Promise<{ tenantId: string; settings: PaymentSettingsData; order: MpOrder } | null> {
  const matches: { tenantId: string; settings: PaymentSettingsData; order: MpOrder }[] = [];

  for (const candidate of candidates) {
    if (!candidate.settings.mpAccessToken) continue;
    try {
      const order = await getPointOrder(dataId, {
        accessToken: candidate.settings.mpAccessToken,
      });
      matches.push({ ...candidate, order });
    } catch {
      // Token sem acesso a essa order — não é a loja dona da notificação.
    }
  }

  if (matches.length !== 1) {
    // Nenhuma loja reconhece a order, ou mais de uma (ambíguo) — em ambos os
    // casos é mais seguro recusar do que adivinhar.
    return null;
  }
  return matches[0];
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const queryDataId = url.searchParams.get("data.id");
  const queryType = url.searchParams.get("type");

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = notificationSchema.safeParse(body);
  const bodyDataId = parsed.success ? parsed.data.data?.id : undefined;
  const dataId = (queryDataId ?? bodyDataId)?.toString() ?? null;
  const type = queryType ?? (parsed.success ? parsed.data.type : undefined);

  if (!dataId) {
    return NextResponse.json({ ok: true, message: "Notificação recebida." });
  }

  if (type && type !== "order") {
    return NextResponse.json({ ok: true, ignored: true, type });
  }

  const sale = await findSaleByMpOrderIdWithRetry(dataId);

  try {
    if (sale) {
      const settings = await getPaymentSettings(sale.tenantId);
      if (!settings.mpAccessToken) {
        return NextResponse.json(
          { error: "Mercado Pago não configurado." },
          { status: 503 },
        );
      }

      const signature = validateMercadoPagoWebhookSignature(
        request.headers.get("x-signature"),
        request.headers.get("x-request-id"),
        dataId,
        settings.mpWebhookSecret,
      );
      if (!signature.ok) {
        return NextResponse.json(
          { error: `Assinatura inválida (${signature.reason}).` },
          { status: 401 },
        );
      }

      const order = await getPointOrder(dataId, { accessToken: settings.mpAccessToken });
      const result = await processMercadoPagoOrder(order, sale.tenantId);
      return NextResponse.json(result, { status: 200 });
    }

    // Venda ainda não conhecida (corrida ou notificação de order avulsa):
    // identifica a loja correta testando as credenciais de cada loja com
    // Mercado Pago ativo, sem confiar cegamente na "primeira" encontrada.
    const rows = await prisma.paymentSettings.findMany({
      where: { activeProvider: "MERCADOPAGO", mpAccessToken: { not: null } },
      select: { tenantId: true },
    });
    const candidates = await Promise.all(
      rows.map(async (row) => ({
        tenantId: row.tenantId,
        settings: await getPaymentSettings(row.tenantId),
      })),
    );

    const resolved = await resolveTenantByProbingCandidates(dataId, candidates);
    if (!resolved) {
      return NextResponse.json(
        { error: "Não foi possível identificar a loja da notificação." },
        { status: 404 },
      );
    }

    const signature = validateMercadoPagoWebhookSignature(
      request.headers.get("x-signature"),
      request.headers.get("x-request-id"),
      dataId,
      resolved.settings.mpWebhookSecret,
    );
    if (!signature.ok) {
      return NextResponse.json(
        { error: `Assinatura inválida (${signature.reason}).` },
        { status: 401 },
      );
    }

    const result = await processMercadoPagoOrder(resolved.order, resolved.tenantId);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Falha ao processar webhook Mercado Pago.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    provider: "mercadopago_point",
    status: "ready",
    webhook: "/api/pagamentos/mercadopago/webhook",
  });
}
