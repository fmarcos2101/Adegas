import type { PaymentMethod, Prisma } from "@prisma/client";

export type SaleLineInput = {
  productId: string;
  quantity: number;
};

export type ComputedSaleLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  total: number;
};

export async function computeSaleLines(
  tx: Prisma.TransactionClient,
  items: SaleLineInput[],
  tenantId: string,
): Promise<{ computed: ComputedSaleLine[]; subtotal: number }> {
  let subtotal = 0;
  const computed: ComputedSaleLine[] = [];

  for (const item of items) {
    const product = await tx.product.findFirst({
      where: { id: item.productId, tenantId },
    });
    if (!product || !product.active) {
      throw new Error("Produto inválido no carrinho.");
    }
    if (product.stock < item.quantity) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    computed.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
      unitCost: product.cost,
      total: lineTotal,
    });
  }

  return { computed, subtotal };
}

export async function applyStockForSale(
  tx: Prisma.TransactionClient,
  tenantId: string,
  saleId: string,
  computed: ComputedSaleLine[],
  movementReason: string,
) {
  for (const line of computed) {
    await tx.product.update({
      where: { id: line.productId },
      data: { stock: { decrement: line.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        tenantId,
        productId: line.productId,
        type: "VENDA",
        quantity: -line.quantity,
        reason: movementReason,
      },
    });
  }
}

export async function restoreStockForSale(
  tx: Prisma.TransactionClient,
  tenantId: string,
  saleId: string,
  items: { productId: string; quantity: number }[],
  reason: string,
) {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        tenantId,
        productId: item.productId,
        type: "ENTRADA",
        quantity: item.quantity,
        reason,
      },
    });
  }
}

export function paymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    DINHEIRO: "Dinheiro",
    PIX: "PIX",
    DEBITO: "Débito",
    CREDITO: "Crédito",
  };
  return labels[method];
}
