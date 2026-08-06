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
  if (!session?.tenantId || session.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }
  const tenantId = session.tenantId;

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
      where: { tenantId_barcode: { tenantId, barcode: rawBarcode } },
    });
    if (exists) {
      return { error: "Já existe um produto com esse código de barras." };
    }
    barcode = rawBarcode;
  }

  const product = await prisma.product.create({
    data: {
      tenantId,
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
        tenantId,
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

const updateProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Nome muito curto"),
  categoryId: z.string().optional().nullable(),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  minStock: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
});

export async function updateProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const session = await getSession();
  if (!session?.tenantId || session.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }
  const tenantId = session.tenantId;

  const parsed = updateProductSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    categoryId: formData.get("categoryId") || null,
    cost: formData.get("cost"),
    price: formData.get("price"),
    minStock: formData.get("minStock"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const existing = await prisma.product.findFirst({
    where: { id: data.id, tenantId },
  });
  if (!existing) return { error: "Produto não encontrado." };

  await prisma.$transaction([
    prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        categoryId: data.categoryId || null,
        cost: data.cost,
        price: data.price,
        minStock: data.minStock,
        active: data.active,
      },
    }),
    prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.userId,
        action: "EDITAR_PRODUTO",
        detail: `${data.name}: custo ${data.cost.toFixed(2)} / venda ${data.price.toFixed(2)}`,
      },
    }),
  ]);

  revalidatePath("/produtos");
  revalidatePath("/pdv");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true };
}

export type ProductActionResult = { error?: string; message?: string };

export async function zeroStock(id: string): Promise<ProductActionResult> {
  const session = await getSession();
  if (!session?.tenantId || session.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }
  const tenantId = session.tenantId;

  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) return { error: "Produto não encontrado." };
  if (product.stock === 0) return { message: "Estoque já está em zero." };

  const delta = -product.stock;
  await prisma.$transaction([
    prisma.product.update({ where: { id }, data: { stock: 0 } }),
    prisma.stockMovement.create({
      data: {
        tenantId,
        productId: id,
        type: "AJUSTE",
        quantity: delta,
        reason: "Estoque zerado manualmente",
      },
    }),
    prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.userId,
        action: "ZERAR_ESTOQUE",
        detail: `${product.name}: ${product.stock} -> 0`,
      },
    }),
  ]);

  revalidatePath("/produtos");
  revalidatePath("/estoque");
  revalidatePath("/");
  return { message: "Estoque zerado." };
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  const session = await getSession();
  if (!session?.tenantId || session.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }
  const tenantId = session.tenantId;

  const product = await prisma.product.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { saleItems: true } } },
  });
  if (!product) return { error: "Produto não encontrado." };

  if (product._count.saleItems > 0) {
    await prisma.$transaction([
      prisma.product.update({ where: { id }, data: { active: false } }),
      prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.userId,
          action: "INATIVAR_PRODUTO",
          detail: `${product.name} inativado (possui vendas)`,
        },
      }),
    ]);
    revalidatePath("/produtos");
    revalidatePath("/");
    return {
      message: "Produto possui vendas: foi inativado para preservar o histórico.",
    };
  }

  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { productId: id, tenantId } }),
    prisma.product.delete({ where: { id } }),
    prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.userId,
        action: "EXCLUIR_PRODUTO",
        detail: `${product.name} excluído`,
      },
    }),
  ]);

  revalidatePath("/produtos");
  revalidatePath("/estoque");
  revalidatePath("/");
  return { message: "Produto excluído." };
}
