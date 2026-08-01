import { NextResponse } from "next/server";
import { z } from "zod";
import { completePendingSaleByRef } from "@/lib/complete-pending-sale";
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
  const ref = paymentRef.trim().toUpperCase();

  try {
    const sale = await import("@/lib/prisma").then((m) =>
      m.prisma.sale.findUnique({ where: { paymentRef: ref } }),
    );

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
      const { prisma } = await import("@/lib/prisma");
      await prisma.auditLog.create({
        data: {
          action: "PAGAMENTO_RECUSADO",
          detail: `Máquina recusou pagamento ref ${ref} (tx ${terminalTxId ?? "-"})`,
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
      paymentSource: "TERMINAL",
      terminalTxId: terminalTxId ?? null,
      method,
      auditAction: "VENDA_LIBERADA_TERMINAL",
      auditDetail: `Venda ${sale.id} paga na máquina — ref ${ref} (${method}) tx ${terminalTxId ?? "-"}`,
    });

    return NextResponse.json({
      ok: true,
      saleId: result.saleId,
      paymentRef: ref,
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
