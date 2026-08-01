"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  type: z.enum(["ENTRADA", "SAIDA", "AJUSTE"]),
  quantity: z.coerce.number().int(),
  reason: z.string().optional(),
});

export type StockState = { error?: string; success?: boolean };

export async function createMovement(
  _prev: StockState,
  formData: FormData,
): Promise<StockState> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const parsed = schema.safeParse({
    productId: formData.get("productId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { productId, type, quantity, reason } = parsed.data;

  // Operador de caixa só pode acrescentar (entrada); nunca dar saída/ajuste.
  if (session.role !== "ADMIN" && type !== "ENTRADA") {
    return {
      error: "Apenas administradores podem registrar saída ou ajuste de estoque.",
    };
  }

  if (type !== "AJUSTE" && quantity <= 0) {
    return { error: "Quantidade deve ser positiva." };
  }
  if (type === "AJUSTE" && quantity < 0) {
    return { error: "Estoque ajustado não pode ser negativo." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Produto não encontrado.");

      let delta = 0;
      let newStock = product.stock;
      if (type === "ENTRADA") {
        delta = quantity;
        newStock = product.stock + quantity;
      } else if (type === "SAIDA") {
        if (product.stock < quantity) {
          throw new Error("Estoque insuficiente para a saída.");
        }
        delta = -quantity;
        newStock = product.stock - quantity;
      } else {
        delta = quantity - product.stock;
        newStock = quantity;
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });
      await tx.stockMovement.create({
        data: { productId, type, quantity: delta, reason: reason ?? null },
      });
      if (type === "AJUSTE") {
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: "AJUSTE_ESTOQUE",
            detail: `${product.name}: ${product.stock} -> ${newStock}${reason ? ` (${reason})` : ""}`,
          },
        });
      }
    });

    revalidatePath("/estoque");
    revalidatePath("/produtos");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha na movimentação.",
    };
  }
}
