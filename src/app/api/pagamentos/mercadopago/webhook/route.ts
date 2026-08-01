import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPaymentSettings } from "@/lib/payment-settings";
import {
  completePendingSaleByMpOrderId,
  completePendingSaleByRef,
} from "@/lib/complete-pending-sale";
import {
  getPointOrder,
  isMercadoPagoOrderApproved,
  mapMpTypeToMethod,
  validateMercadoPagoWebhookSignature,
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
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/estoque");
  revalidatePath("/relatorios");
}

async function processMercadoPagoOrder(
  orderId: string,
  creds: { accessToken: string; webhookSecret?: string },
) {
  const order = await getPointOrder(orderId, { accessToken: creds.accessToken });
  const paymentRef = order.external_reference?.trim().toUpperCase();
  const paymentId = order.transactions?.payments?.[0]?.id;
  const method = mapMpTypeToMethod(order.config?.payment_method?.default_type);

  if (isMercadoPagoOrderApproved(order.status)) {
    if (paymentRef) {
      const result = await completePendingSaleByRef(paymentRef, {
        paymentSource: "MERCADOPAGO",
        terminalTxId: paymentId ?? order.id,
        method,
        auditAction: "VENDA_LIBERADA_MERCADOPAGO",
        auditDetail: `Venda liberada via Mercado Pago Point — ref ${paymentRef} order ${order.id}`,
      });
      if (result.found) {
        revalidateSalePaths();
        return { ok: true, saleId: result.saleId, status: "CONCLUIDA" };
      }
    }

    const byOrder = await completePendingSaleByMpOrderId(order.id, {
      paymentSource: "MERCADOPAGO",
      terminalTxId: paymentId ?? order.id,
      method,
      auditAction: "VENDA_LIBERADA_MERCADOPAGO",
      auditDetail: `Venda liberada via Mercado Pago Point — order ${order.id}`,
    });
    if (byOrder.found) {
      revalidateSalePaths();
      return { ok: true, saleId: byOrder.saleId, status: "CONCLUIDA" };
    }

    return { ok: false, reason: "sale_not_found", orderId: order.id };
  }

  return { ok: true, ignored: true, orderStatus: order.status };
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

  const settings = await getPaymentSettings();

  const validSignature = validateMercadoPagoWebhookSignature(
    request.headers.get("x-signature"),
    request.headers.get("x-request-id"),
    dataId,
    settings.mpWebhookSecret,
  );
  if (!validSignature) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  if (!dataId) {
    return NextResponse.json({ ok: true, message: "Notificação recebida." });
  }

  if (type && type !== "order") {
    return NextResponse.json({ ok: true, ignored: true, type });
  }

  try {
    if (!settings.mpAccessToken) {
      return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 503 });
    }
    const result = await processMercadoPagoOrder(dataId, {
      accessToken: settings.mpAccessToken,
      webhookSecret: settings.mpWebhookSecret,
    });
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
