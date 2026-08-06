"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isInternalBarcode } from "@/lib/constants";
import { generatePaymentRef } from "@/lib/payment-terminal";
import { sendSaleToTerminalProvider } from "@/lib/payment-providers";
import { getPaymentSettings } from "@/lib/payment-settings";
import {
  applyStockForSale,
  computeSaleLines,
  restoreStockForSale,
} from "@/lib/sale-service";

export type FoundProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
};

function publicBarcode(barcode: string): string | null {
  return isInternalBarcode(barcode) ? null : barcode;
}

export async function findProductByBarcode(
  barcode: string,
): Promise<{ product?: FoundProduct; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const code = barcode.trim();
  if (!code) return { error: "Código vazio." };

  const product = await prisma.product.findFirst({
    where: {
      active: true,
      OR: [{ barcode: code }, { name: { contains: code } }],
    },
  });

  if (!product) return { error: "Produto não encontrado." };

  return {
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      barcode: publicBarcode(product.barcode),
    },
  };
}

export async function searchProducts(term: string): Promise<FoundProduct[]> {
  const session = await getSession();
  if (!session) return [];

  const q = term.trim();
  if (q.length < 1) return [];

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [{ name: { contains: q } }, { barcode: { startsWith: q } }],
    },
    orderBy: { name: "asc" },
    take: 8,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    barcode: publicBarcode(p.barcode),
  }));
}

export async function listStock(): Promise<FoundProduct[]> {
  const session = await getSession();
  if (!session) return [];

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    barcode: publicBarcode(p.barcode),
  }));
}

const paymentMethodEnum = z.enum(["DINHEIRO", "PIX", "DEBITO", "CREDITO"]);

const paymentLineSchema = z.object({
  method: paymentMethodEnum,
  amount: z.coerce.number().positive("Valor de pagamento inválido."),
});

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, "Adicione ao menos um item."),
  discount: z.coerce.number().min(0).default(0),
  /** Forma única (compatível) — se informado sem `payments`, vira um único pagamento. */
  method: paymentMethodEnum.optional(),
  /** Um ou dois pagamentos (ex.: dinheiro + PIX, PIX + cartão). */
  payments: z.array(paymentLineSchema).min(1).max(2).optional(),
});

export type FinalizeInput = z.input<typeof saleSchema>;
export type PaymentLineInput = z.infer<typeof paymentLineSchema>;

const CARD_METHODS = new Set(["DEBITO", "CREDITO"]);

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function paymentsDetail(
  payments: { method: string; amount: number }[],
): string {
  return payments
    .map((p) => `${p.method} ${p.amount.toFixed(2)}`)
    .join(" + ");
}

function resolvePayments(
  data: z.infer<typeof saleSchema>,
  total: number,
): { payments?: PaymentLineInput[]; error?: string } {
  const totalRounded = roundMoney(total);
  if (totalRounded <= 0) {
    return { error: "Total da venda deve ser maior que zero." };
  }

  let payments: PaymentLineInput[];
  if (data.payments && data.payments.length > 0) {
    payments = data.payments.map((p) => ({
      method: p.method,
      amount: roundMoney(p.amount),
    }));
  } else if (data.method) {
    payments = [{ method: data.method, amount: totalRounded }];
  } else {
    return { error: "Informe a forma de pagamento." };
  }

  if (payments.length === 2 && payments[0].method === payments[1].method) {
    return { error: "No pagamento duplo, as formas devem ser diferentes." };
  }

  const sum = roundMoney(payments.reduce((s, p) => s + p.amount, 0));
  if (Math.abs(sum - totalRounded) > 0.009) {
    return {
      error: `A soma dos pagamentos (${sum.toFixed(2)}) deve ser igual ao total (${totalRounded.toFixed(2)}).`,
    };
  }

  return { payments };
}

function revalidateSalePaths() {
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/estoque");
  revalidatePath("/relatorios");
}

export async function finalizeSale(
  input: FinalizeInput,
): Promise<{ saleId?: string; total?: number; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { items, discount } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { computed, subtotal } = await computeSaleLines(tx, items);
      const total = roundMoney(Math.max(0, subtotal - discount));
      const resolved = resolvePayments(parsed.data, total);
      if (resolved.error || !resolved.payments) {
        throw new Error(resolved.error ?? "Pagamentos inválidos.");
      }
      const payments = resolved.payments;

      const sale = await tx.sale.create({
        data: {
          total,
          discount,
          status: "CONCLUIDA",
          paymentSource: "IMEDIATO",
          paymentConfirmedAt: new Date(),
          userId: session.userId,
          items: { create: computed },
          payments: { create: payments },
        },
      });

      await applyStockForSale(tx, sale.id, computed, `Venda ${sale.id}`);

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "VENDA",
          detail: `Venda ${sale.id} finalizada (${paymentsDetail(payments)}) - total ${total.toFixed(2)}`,
        },
      });

      return { saleId: sale.id, total };
    });

    revalidateSalePaths();
    return result;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao finalizar venda.",
    };
  }
}

export async function createPendingTerminalSale(
  input: FinalizeInput,
): Promise<{
  saleId?: string;
  total?: number;
  terminalAmount?: number;
  paymentRef?: string;
  mpOrderId?: string;
  provider?: "mercadopago" | "generic" | "sumup" | "ton";
  payments?: PaymentLineInput[];
  error?: string;
}> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { items, discount } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { computed, subtotal } = await computeSaleLines(tx, items);
      const total = roundMoney(Math.max(0, subtotal - discount));
      const resolved = resolvePayments(parsed.data, total);
      if (resolved.error || !resolved.payments) {
        throw new Error(resolved.error ?? "Pagamentos inválidos.");
      }
      const payments = resolved.payments;

      const cardPayments = payments.filter((p) => CARD_METHODS.has(p.method));
      if (cardPayments.length === 0) {
        throw new Error(
          "Pagamento via máquina disponível apenas quando há débito ou crédito.",
        );
      }
      if (cardPayments.length > 1) {
        throw new Error(
          "No pagamento com máquina, use apenas uma forma de cartão (débito ou crédito).",
        );
      }
      const cardPayment = cardPayments[0];
      const terminalAmount = cardPayment.amount;

      let paymentRef = generatePaymentRef();
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await tx.sale.findUnique({ where: { paymentRef } });
        if (!exists) break;
        paymentRef = generatePaymentRef();
      }

      const sale = await tx.sale.create({
        data: {
          total,
          discount,
          status: "AGUARDANDO_PAGAMENTO",
          paymentRef,
          paymentSource: "TERMINAL",
          userId: session.userId,
          items: { create: computed },
          payments: { create: payments },
        },
      });

      await applyStockForSale(
        tx,
        sale.id,
        computed,
        `Reserva venda ${sale.id} (aguardando pagamento)`,
      );

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "VENDA_PENDENTE",
          detail: `Venda ${sale.id} aguardando máquina — ref ${paymentRef} (${paymentsDetail(payments)}; máquina ${terminalAmount.toFixed(2)}) total ${total.toFixed(2)}`,
        },
      });

      return {
        saleId: sale.id,
        total,
        terminalAmount,
        paymentRef,
        method: cardPayment.method as "DEBITO" | "CREDITO",
        payments,
      };
    });

    const settings = await getPaymentSettings();

    try {
      const sent = await sendSaleToTerminalProvider({
        paymentRef: result.paymentRef,
        total: result.terminalAmount,
        method: result.method,
      });

      if (sent.providerOrderId) {
        await prisma.sale.update({
          where: { id: result.saleId },
          data: {
            mpOrderId: sent.providerOrderId,
            paymentSource: "MERCADOPAGO",
          },
        });
        await prisma.auditLog.create({
          data: {
            userId: session.userId,
            action: "MP_ORDER_CRIADA",
            detail: `Order Mercado Pago ${sent.providerOrderId} — ref ${result.paymentRef} (máquina ${result.terminalAmount.toFixed(2)})`,
          },
        });
      } else if (settings.activeProvider === "SUMUP") {
        await prisma.sale.update({
          where: { id: result.saleId },
          data: { paymentSource: "SUMUP" },
        });
      } else if (settings.activeProvider === "TON") {
        await prisma.sale.update({
          where: { id: result.saleId },
          data: { paymentSource: "TON" },
        });
      }

      revalidateSalePaths();
      return {
        saleId: result.saleId,
        total: result.total,
        terminalAmount: result.terminalAmount,
        paymentRef: result.paymentRef,
        mpOrderId: sent.providerOrderId,
        provider: sent.provider,
        payments: result.payments,
      };
    } catch (err) {
      await cancelPendingSale(result.saleId);
      return {
        error: err instanceof Error ? err.message : "Falha ao enviar para a maquininha.",
      };
    }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Falha ao enviar para a máquina.",
    };
  }
}

export async function confirmSaleManually(
  saleId: string,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { payments: true },
      });
      if (!sale) throw new Error("Venda não encontrada.");
      if (sale.status !== "AGUARDANDO_PAGAMENTO") {
        throw new Error("Esta venda não está aguardando pagamento.");
      }

      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "CONCLUIDA",
          paymentSource: "MANUAL",
          paymentConfirmedAt: new Date(),
        },
      });

      const methods =
        sale.payments.length > 0
          ? paymentsDetail(sale.payments)
          : "DEBITO";
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "VENDA_LIBERADA_MANUAL",
          detail: `Venda ${saleId} liberada manualmente por ${session.name} (${methods}) — ref ${sale.paymentRef ?? "-"}`,
        },
      });
    });

    revalidateSalePaths();
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao liberar venda.",
    };
  }
}

export async function cancelPendingSale(
  saleId: string,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });
      if (!sale) throw new Error("Venda não encontrada.");
      if (sale.status !== "AGUARDANDO_PAGAMENTO") {
        throw new Error("Somente vendas aguardando pagamento podem ser canceladas.");
      }

      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "CANCELADA",
          cancelReason: "Pagamento não confirmado / cancelado no PDV",
        },
      });

      await restoreStockForSale(
        tx,
        saleId,
        sale.items,
        `Cancelamento venda pendente ${saleId}`,
      );

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "VENDA_PENDENTE_CANCELADA",
          detail: `Venda pendente ${saleId} cancelada — ref ${sale.paymentRef ?? "-"}`,
        },
      });
    });

    revalidateSalePaths();
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Falha ao cancelar venda pendente.",
    };
  }
}

export async function getSalePaymentStatus(saleId: string): Promise<{
  status?: string;
  total?: number;
  paymentRef?: string | null;
  method?: string;
  payments?: { method: string; amount: number }[];
  error?: string;
}> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { payments: true },
  });
  if (!sale) return { error: "Venda não encontrada." };

  return {
    status: sale.status,
    total: sale.total,
    paymentRef: sale.paymentRef,
    method: sale.payments[0]?.method,
    payments: sale.payments.map((p) => ({ method: p.method, amount: p.amount })),
  };
}
