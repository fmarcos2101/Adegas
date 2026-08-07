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

/**
 * Agrupa linhas repetidas do mesmo produto antes de validar/consumir estoque.
 * Sem essa consolidação, o mesmo produto pode aparecer em várias linhas do
 * carrinho e cada linha seria validada isoladamente contra o estoque total,
 * permitindo vender mais unidades do que existem (estoque negativo).
 */
function consolidateLines(items: SaleLineInput[]): SaleLineInput[] {
  const byProduct = new Map<string, number>();
  for (const item of items) {
    byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.quantity);
  }
  return Array.from(byProduct.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export async function computeSaleLines(
  tx: Prisma.TransactionClient,
  items: SaleLineInput[],
  tenantId: string,
): Promise<{ computed: ComputedSaleLine[]; subtotal: number }> {
  let subtotal = 0;
  const computed: ComputedSaleLine[] = [];

  for (const item of consolidateLines(items)) {
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
    // Update condicional: só decrementa se ainda houver estoque suficiente
    // no momento exato da escrita, fechando a corrida entre a validação
    // (computeSaleLines) e a gravação quando duas vendas concorrentes
    // disputam o mesmo produto.
    const { count } = await tx.product.updateMany({
      where: { id: line.productId, tenantId, stock: { gte: line.quantity } },
      data: { stock: { decrement: line.quantity } },
    });
    if (count === 0) {
      const product = await tx.product.findFirst({
        where: { id: line.productId, tenantId },
      });
      throw new Error(
        `Estoque insuficiente para ${product?.name ?? "produto"}.`,
      );
    }
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

/** Desconto máximo (% do subtotal) que um operador de CAIXA pode aplicar sem um ADMIN. */
export const MAX_CAIXA_DISCOUNT_PERCENT = 10;

/**
 * Calcula o total aplicando o desconto com limites de segurança:
 * - nunca deixa o desconto ultrapassar o subtotal (evita valores negativos);
 * - operadores de CAIXA não podem zerar/descontar a venda livremente — acima
 *   de MAX_CAIXA_DISCOUNT_PERCENT do subtotal é preciso um ADMIN.
 */
export function applyDiscountLimit(
  discount: number,
  subtotal: number,
  role: "ADMIN" | "CAIXA",
): { total: number; discount: number } {
  const cappedDiscount = Math.min(Math.max(0, discount), subtotal);

  if (role !== "ADMIN") {
    const maxAllowed = (subtotal * MAX_CAIXA_DISCOUNT_PERCENT) / 100;
    if (cappedDiscount > maxAllowed + 0.009) {
      throw new Error(
        `Desconto acima de ${MAX_CAIXA_DISCOUNT_PERCENT}% do subtotal exige autorização de um administrador.`,
      );
    }
  }

  return { total: subtotal - cappedDiscount, discount: cappedDiscount };
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
