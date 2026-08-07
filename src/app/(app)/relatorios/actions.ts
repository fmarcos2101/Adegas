"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveTenantAdmin } from "@/lib/session-guard";

export async function cancelSale(
  saleId: string,
  reason: string,
): Promise<{ success?: boolean; error?: string }> {
  let session: Awaited<ReturnType<typeof requireActiveTenantAdmin>>;
  try {
    session = await requireActiveTenantAdmin();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não autorizado." };
  }
  const tenantId = session.tenantId;
  if (!reason.trim()) return { error: "Informe o motivo do cancelamento." };

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, tenantId },
        include: { items: true },
      });
      if (!sale) throw new Error("Venda não encontrada.");
      if (sale.status === "CANCELADA") throw new Error("Venda já cancelada.");

      await tx.sale.update({
        where: { id: saleId },
        data: { status: "CANCELADA", cancelReason: reason.trim() },
      });

      if (sale.status === "CONCLUIDA" || sale.status === "AGUARDANDO_PAGAMENTO") {
        for (const item of sale.items) {
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
              reason: `Cancelamento da venda ${saleId}`,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session.userId,
          action: "CANCELAMENTO_VENDA",
          detail: `Venda ${saleId} cancelada. Motivo: ${reason.trim()}`,
        },
      });
    });

    revalidatePath("/relatorios");
    revalidatePath("/dashboard");
    revalidatePath("/produtos");
    revalidatePath("/estoque");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao cancelar venda.",
    };
  }
}
