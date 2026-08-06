import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { completePendingSaleByRef } from "@/lib/complete-pending-sale";
import { getPaymentSettings } from "@/lib/payment-settings";
import type { PaymentSource } from "@prisma/client";

const callbackSchema = z.object({
  paymentRef: z.string().min(4).max(16),
  amount: z.coerce.number().positive(),
  method: z.enum(["DEBITO", "CREDITO"]),
  status: z.enum(["APPROVED", "DECLINED"]),
  terminalTxId: z.string().optional(),
});

export async function handleTerminalCallback(
  request: Request,
  options: {
    paymentSource: PaymentSource;
    auditAction: string;
    /** Valida a chave usando as settings da loja da venda */
    validateKey: (
      request: Request,
      settings: Awaited<ReturnType<typeof getPaymentSettings>>,
    ) => boolean;
  },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = callbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido." },
      { status: 400 },
    );
  }

  const { paymentRef, amount, method, status, terminalTxId } = parsed.data;
  const ref = paymentRef.trim().toUpperCase();

  const sale = await prisma.sale.findUnique({ where: { paymentRef: ref } });
  if (!sale) {
    return NextResponse.json(
      { error: "Venda não encontrada para esta referência." },
      { status: 404 },
    );
  }

  const settings = await getPaymentSettings(sale.tenantId);
  if (!options.validateKey(request, settings)) {
    return NextResponse.json({ error: "Chave de API inválida." }, { status: 401 });
  }

  if (sale.status !== "AGUARDANDO_PAGAMENTO") {
    return NextResponse.json({
      ok: true,
      saleId: sale.id,
      paymentRef: sale.paymentRef,
      status: sale.status,
      message: "Venda já processada.",
    });
  }

  if (Math.abs(sale.total - amount) > 0.01) {
    return NextResponse.json(
      {
        error: `Valor divergente. Esperado ${sale.total.toFixed(2)}, recebido ${amount.toFixed(2)}.`,
      },
      { status: 409 },
    );
  }

  if (status === "DECLINED") {
    await prisma.auditLog.create({
      data: {
        tenantId: sale.tenantId,
        action: "PAGAMENTO_RECUSADO",
        detail: `Pagamento recusado ref ${ref} (tx ${terminalTxId ?? "-"})`,
      },
    });
    return NextResponse.json({
      ok: true,
      saleId: sale.id,
      paymentRef: sale.paymentRef,
      status: sale.status,
      message: "Pagamento recusado registrado. Venda permanece pendente.",
    });
  }

  const result = await completePendingSaleByRef(ref, {
    paymentSource: options.paymentSource,
    terminalTxId: terminalTxId ?? null,
    method,
    auditAction: options.auditAction,
    auditDetail: `Venda ${sale.id} paga — ref ${ref} (${method}) tx ${terminalTxId ?? "-"}`,
  });

  return NextResponse.json({
    ok: true,
    saleId: result.saleId,
    paymentRef: ref,
    status: "CONCLUIDA",
  });
}
