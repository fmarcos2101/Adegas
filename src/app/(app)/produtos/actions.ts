"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  barcode: z.string().min(3, "Código de barras inválido"),
  categoryId: z.string().optional().nullable(),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
});

export type ProductState = { error?: string; success?: boolean };

export async function createProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    barcode: formData.get("barcode"),
    categoryId: formData.get("categoryId") || null,
    cost: formData.get("cost"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    minStock: formData.get("minStock"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  const exists = await prisma.product.findUnique({
    where: { barcode: data.barcode },
  });
  if (exists) {
    return { error: "Já existe um produto com esse código de barras." };
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      barcode: data.barcode,
      categoryId: data.categoryId || null,
      cost: data.cost,
      price: data.price,
      stock: data.stock,
      minStock: data.minStock,
    },
  });

  if (data.stock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "ENTRADA",
        quantity: data.stock,
        reason: "Estoque inicial no cadastro",
      },
    });
  }

  revalidatePath("/produtos");
  revalidatePath("/");
  return { success: true };
}
