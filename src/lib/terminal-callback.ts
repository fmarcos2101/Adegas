import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { completePendingSaleByRef } from "@/lib/complete-pending-sale";
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
    validateKey: (request: Request) => boolean;
  },
) {
  if (!options.validateKey(request)) {
    return NextResponse.json({ error: "Chave de API inválida." }, { status: 401 });
  }

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

  const sale = await prisma.sale.findUnique({
    where: { paymentRef: ref },
    include: { payments: true },
  });
  if (!sale) {
    return NextResponse.json(
      { error: "Venda não encontrada para esta referência." },
      { status: 404 },
    );
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

  // Em pagamento duplo, a máquina cobre só a parte em cartão
  const cardAmount =
    sale.payments
      .filter((p) => p.method === "DEBITO" || p.method === "CREDITO")
      .reduce((s, p) => s + p.amount, 0) || sale.total;

  if (Math.abs(cardAmount - amount) > 0.01) {
    return NextResponse.json(
      {
        error: `Valor divergente. Esperado ${cardAmount.toFixed(2)}, recebido ${amount.toFixed(2)}.`,
      },
      { status: 409 },
    );
  }

  if (status === "DECLINED") {
    await prisma.auditLog.create({
      data: {
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
