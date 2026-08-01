"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { INTERNAL_BARCODE_PREFIX } from "@/lib/constants";

const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  barcode: z.string().optional(),
  noBarcode: z.boolean().default(false),
  categoryId: z.string().optional().nullable(),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
});

export type ProductState = { error?: string; success?: boolean };

function generateInternalBarcode(): string {
  return `${INTERNAL_BARCODE_PREFIX}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`.toUpperCase();
}

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
    noBarcode: formData.get("noBarcode") === "on",
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
  const rawBarcode = (data.barcode ?? "").trim();

  let barcode: string;
  if (data.noBarcode || rawBarcode === "") {
    barcode = generateInternalBarcode();
  } else {
    if (rawBarcode.length < 3) {
      return { error: "Código de barras inválido (mínimo 3 dígitos)." };
    }
    const exists = await prisma.product.findUnique({
      where: { barcode: rawBarcode },
    });
    if (exists) {
      return { error: "Já existe um produto com esse código de barras." };
    }
    barcode = rawBarcode;
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      barcode,
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
