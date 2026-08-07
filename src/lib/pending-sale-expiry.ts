import { prisma } from "@/lib/prisma";
import { restoreStockForSale } from "@/lib/sale-service";

/**
 * Vendas "aguardando pagamento" (maquininha) reservam estoque imediatamente.
 * Sem expiração automática, uma venda esquecida na maquininha prende esse
 * estoque indefinidamente. Depois desse prazo, a venda é cancelada e o
 * estoque devolvido automaticamente.
 */
export const PENDING_SALE_EXPIRY_MINUTES = 20;

/**
 * Cancela e devolve o estoque de vendas pendentes antigas de uma loja.
 * Roda de forma independente de sessão (pode ser chamada a partir de rotas
 * de webhook/polling) e é segura para chamadas concorrentes: cada venda é
 * fechada dentro de uma transação que revalida o status antes de alterar.
 */
export async function expireStalePendingSales(tenantId: string): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_SALE_EXPIRY_MINUTES * 60_000);

  const stale = await prisma.sale.findMany({
    where: {
      tenantId,
      status: "AGUARDANDO_PAGAMENTO",
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });

  let cancelled = 0;
  for (const { id: saleId } of stale) {
    try {
      await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.findFirst({
          where: { id: saleId, tenantId, status: "AGUARDANDO_PAGAMENTO" },
          include: { items: true },
        });
        if (!sale) return;

        await tx.sale.update({
          where: { id: saleId },
          data: {
            status: "CANCELADA",
            cancelReason: `Cancelada automaticamente após ${PENDING_SALE_EXPIRY_MINUTES} min sem confirmação de pagamento`,
          },
        });

        await restoreStockForSale(
          tx,
          tenantId,
          saleId,
          sale.items,
          `Expiração automática venda pendente ${saleId}`,
        );

        await tx.auditLog.create({
          data: {
            tenantId,
            action: "VENDA_PENDENTE_EXPIRADA",
            detail: `Venda pendente ${saleId} cancelada automaticamente (ref ${sale.paymentRef ?? "-"})`,
          },
        });
      });
      cancelled += 1;
    } catch {
      // Se outra requisição já resolveu essa venda (pago/cancelado
      // concorrentemente), apenas segue para a próxima.
    }
  }

  return cancelled;
}
