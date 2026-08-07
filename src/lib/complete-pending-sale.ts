import type { PaymentMethod, PaymentSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function completePendingSale(
  tx: Prisma.TransactionClient,
  saleId: string,
  options: {
    paymentSource: PaymentSource;
    terminalTxId?: string | null;
    method?: PaymentMethod;
    auditAction: string;
    auditDetail: string;
    userId?: string | null;
    /**
     * Valor efetivamente confirmado pelo provedor de pagamento. Quando
     * informado, é comparado ao total da venda antes de liberá-la — evita
     * liberar uma venda maior do que o valor realmente pago.
     */
    paidAmount?: number | null;
  },
) {
  const sale = await tx.sale.findUnique({
    where: { id: saleId },
    include: { payments: true },
  });
  if (!sale) throw new Error("Venda não encontrada.");
  if (sale.status === "CONCLUIDA") return sale;
  if (sale.status !== "AGUARDANDO_PAGAMENTO") {
    throw new Error("Venda não está aguardando pagamento.");
  }

  if (
    options.paidAmount != null &&
    Math.abs(sale.total - options.paidAmount) > 0.01
  ) {
    throw new Error(
      `Valor pago (${options.paidAmount.toFixed(2)}) diverge do total da venda (${sale.total.toFixed(2)}).`,
    );
  }

  await tx.sale.update({
    where: { id: saleId },
    data: {
      status: "CONCLUIDA",
      paymentSource: options.paymentSource,
      paymentConfirmedAt: new Date(),
      terminalTxId: options.terminalTxId ?? sale.terminalTxId,
    },
  });

  if (options.method && sale.payments[0] && sale.payments[0].method !== options.method) {
    await tx.payment.update({
      where: { id: sale.payments[0].id },
      data: { method: options.method },
    });
  }

  await tx.auditLog.create({
    data: {
      tenantId: sale.tenantId,
      userId: options.userId ?? null,
      action: options.auditAction,
      detail: options.auditDetail,
    },
  });

  return sale;
}

export async function completePendingSaleByRef(
  paymentRef: string,
  options: {
    paymentSource: PaymentSource;
    terminalTxId?: string | null;
    method?: PaymentMethod;
    auditAction: string;
    auditDetail: string;
    userId?: string | null;
    paidAmount?: number | null;
  },
) {
  const ref = paymentRef.trim().toUpperCase();
  const sale = await prisma.sale.findUnique({ where: { paymentRef: ref } });
  if (!sale) return { found: false as const };

  await prisma.$transaction(async (tx) => {
    await completePendingSale(tx, sale.id, options);
  });

  return { found: true as const, saleId: sale.id, alreadyDone: sale.status === "CONCLUIDA" };
}

export async function completePendingSaleByMpOrderId(
  mpOrderId: string,
  options: {
    paymentSource: PaymentSource;
    terminalTxId?: string | null;
    method?: PaymentMethod;
    auditAction: string;
    auditDetail: string;
    paidAmount?: number | null;
  },
) {
  const sale = await prisma.sale.findUnique({ where: { mpOrderId } });
  if (!sale) return { found: false as const };

  await prisma.$transaction(async (tx) => {
    await completePendingSale(tx, sale.id, options);
  });

  return { found: true as const, saleId: sale.id, alreadyDone: sale.status === "CONCLUIDA" };
}
