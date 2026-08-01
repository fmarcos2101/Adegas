import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TERMINAL_CALLBACK_PATH,
  validateTerminalApiKey,
} from "@/lib/payment-terminal";

const callbackSchema = z.object({
  paymentRef: z.string().min(4).max(16),
  amount: z.coerce.number().positive(),
  method: z.enum(["DEBITO", "CREDITO"]),
  status: z.enum(["APPROVED", "DECLINED"]),
  terminalTxId: z.string().optional(),
});

export async function POST(request: Request) {
  if (!validateTerminalApiKey(request as unknown as import("next/server").NextRequest)) {
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

  try {
    const sale = await prisma.sale.findUnique({
      where: { paymentRef: paymentRef.toUpperCase() },
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
          action: "PAGAMENTO_RECUSADO",
          detail: `Máquina recusou pagamento ref ${paymentRef} (tx ${terminalTxId ?? "-"})`,
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

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: "CONCLUIDA",
          paymentSource: "TERMINAL",
          paymentConfirmedAt: new Date(),
          terminalTxId: terminalTxId ?? null,
        },
      });

      if (sale.payments[0] && sale.payments[0].method !== method) {
        await tx.payment.update({
          where: { id: sale.payments[0].id },
          data: { method },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "VENDA_LIBERADA_TERMINAL",
          detail: `Venda ${sale.id} paga na máquina — ref ${paymentRef} (${method}) tx ${terminalTxId ?? "-"}`,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      saleId: sale.id,
      paymentRef: sale.paymentRef,
      status: "CONCLUIDA",
      endpoint: TERMINAL_CALLBACK_PATH,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Falha ao processar pagamento.",
      },
      { status: 500 },
    );
  }
}
