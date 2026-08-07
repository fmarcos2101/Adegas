"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireActiveTenantSession } from "@/lib/session-guard";
import { isInternalBarcode } from "@/lib/constants";
import { generatePaymentRef } from "@/lib/payment-terminal";
import { sendSaleToTerminalProvider } from "@/lib/payment-providers";
import { getPaymentSettings } from "@/lib/payment-settings";
import {
  applyDiscountLimit,
  applyStockForSale,
  computeSaleLines,
  restoreStockForSale,
} from "@/lib/sale-service";
import { expireStalePendingSales } from "@/lib/pending-sale-expiry";

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
  let tenantId: string;
  try {
    tenantId = (await requireActiveTenantSession()).tenantId;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não autorizado." };
  }

  const code = barcode.trim();
  if (!code) return { error: "Código vazio." };

  const product = await prisma.product.findFirst({
    where: {
      tenantId,
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
  let tenantId: string;
  try {
    tenantId = (await requireActiveTenantSession()).tenantId;
  } catch {
    return [];
  }

  const q = term.trim();
  if (q.length < 1) return [];

  const products = await prisma.product.findMany({
    where: {
      tenantId,
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
  let tenantId: string;
  try {
    tenantId = (await requireActiveTenantSession()).tenantId;
  } catch {
    return [];
  }

  const products = await prisma.product.findMany({
    where: { tenantId, active: true },
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
  method: z.enum(["DINHEIRO", "PIX", "DEBITO", "CREDITO"]),
});

export type FinalizeInput = z.input<typeof saleSchema>;

function revalidateSalePaths() {
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/estoque");
  revalidatePath("/relatorios");
}

export async function finalizeSale(
  input: FinalizeInput,
): Promise<{ saleId?: string; total?: number; error?: string }> {
  let session: Awaited<ReturnType<typeof requireActiveTenantSession>>;
  try {
    session = await requireActiveTenantSession();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não autorizado." };
  }
  const tenantId = session.tenantId;

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { items, discount: rawDiscount, method } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { computed, subtotal } = await computeSaleLines(tx, items, tenantId);
      const { total, discount } = applyDiscountLimit(rawDiscount, subtotal, session.role);

      const sale = await tx.sale.create({
        data: {
          tenantId,
          total,
          discount,
          status: "CONCLUIDA",
          paymentSource: "IMEDIATO",
          paymentConfirmedAt: new Date(),
          userId: session.userId,
          items: { create: computed },
          payments: { create: [{ method, amount: total }] },
        },
      });

      await applyStockForSale(tx, tenantId, sale.id, computed, `Venda ${sale.id}`);

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session.userId,
          action: "VENDA",
          detail: `Venda ${sale.id} finalizada (${method}) - total ${total.toFixed(2)}`,
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
  paymentRef?: string;
  mpOrderId?: string;
  provider?: "mercadopago" | "generic" | "sumup" | "ton";
  error?: string;
}> {
  let session: Awaited<ReturnType<typeof requireActiveTenantSession>>;
  try {
    session = await requireActiveTenantSession();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não autorizado." };
  }
  const tenantId = session.tenantId;

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { items, discount: rawDiscount, method } = parsed.data;

  if (method !== "DEBITO" && method !== "CREDITO") {
    return {
      error: "Pagamento via máquina disponível apenas para débito ou crédito.",
    };
  }

  // Libera estoque de vendas antigas ainda "aguardando pagamento" antes de
  // reservar mais estoque para esta nova venda.
  await expireStalePendingSales(tenantId);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { computed, subtotal } = await computeSaleLines(tx, items, tenantId);
      const { total, discount } = applyDiscountLimit(rawDiscount, subtotal, session.role);

      let paymentRef = generatePaymentRef();
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await tx.sale.findUnique({ where: { paymentRef } });
        if (!exists) break;
        paymentRef = generatePaymentRef();
      }

      const sale = await tx.sale.create({
        data: {
          tenantId,
          total,
          discount,
          status: "AGUARDANDO_PAGAMENTO",
          paymentRef,
          paymentSource: "TERMINAL",
          userId: session.userId,
          items: { create: computed },
          payments: { create: [{ method, amount: total }] },
        },
      });

      await applyStockForSale(
        tx,
        tenantId,
        sale.id,
        computed,
        `Reserva venda ${sale.id} (aguardando pagamento)`,
      );

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session.userId,
          action: "VENDA_PENDENTE",
          detail: `Venda ${sale.id} aguardando máquina — ref ${paymentRef} (${method}) total ${total.toFixed(2)}`,
        },
      });

      return { saleId: sale.id, total, paymentRef, method };
    });

    const settings = await getPaymentSettings(tenantId);

    try {
      const sent = await sendSaleToTerminalProvider({
        tenantId,
        paymentRef: result.paymentRef,
        total: result.total,
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
            tenantId,
            userId: session.userId,
            action: "MP_ORDER_CRIADA",
            detail: `Order Mercado Pago ${sent.providerOrderId} — ref ${result.paymentRef}`,
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
        paymentRef: result.paymentRef,
        mpOrderId: sent.providerOrderId,
        provider: sent.provider,
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
  let session: Awaited<ReturnType<typeof requireActiveTenantSession>>;
  try {
    session = await requireActiveTenantSession();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não autorizado." };
  }
  const tenantId = session.tenantId;

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, tenantId },
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

      const method = sale.payments[0]?.method ?? "DEBITO";
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session.userId,
          action: "VENDA_LIBERADA_MANUAL",
          detail: `Venda ${saleId} liberada manualmente por ${session.name} (${method}) — ref ${sale.paymentRef ?? "-"}`,
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
  let session: Awaited<ReturnType<typeof requireActiveTenantSession>>;
  try {
    session = await requireActiveTenantSession();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não autorizado." };
  }
  const tenantId = session.tenantId;

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, tenantId },
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
        tenantId,
        saleId,
        sale.items,
        `Cancelamento venda pendente ${saleId}`,
      );

      await tx.auditLog.create({
        data: {
          tenantId,
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
  error?: string;
}> {
  let tenantId: string;
  try {
    tenantId = (await requireActiveTenantSession()).tenantId;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não autorizado." };
  }

  await expireStalePendingSales(tenantId);

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, tenantId },
    include: { payments: true },
  });
  if (!sale) return { error: "Venda não encontrada." };

  return {
    status: sale.status,
    total: sale.total,
    paymentRef: sale.paymentRef,
    method: sale.payments[0]?.method,
  };
}
