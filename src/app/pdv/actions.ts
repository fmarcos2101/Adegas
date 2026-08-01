"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isInternalBarcode } from "@/lib/constants";

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

export async function finalizeSale(
  input: FinalizeInput,
): Promise<{ saleId?: string; total?: number; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado." };

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { items, discount, method } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const computed: {
        productId: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
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
          total: lineTotal,
        });
      }

      const total = Math.max(0, subtotal - discount);

      const sale = await tx.sale.create({
        data: {
          total,
          discount,
          status: "CONCLUIDA",
          userId: session.userId,
          items: { create: computed },
          payments: { create: [{ method, amount: total }] },
        },
      });

      for (const line of computed) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            type: "VENDA",
            quantity: -line.quantity,
            reason: `Venda ${sale.id}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "VENDA",
          detail: `Venda ${sale.id} finalizada (${method}) - total ${total.toFixed(2)}`,
        },
      });

      return { saleId: sale.id, total };
    });

    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/estoque");
    return result;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao finalizar venda.",
    };
  }
}
