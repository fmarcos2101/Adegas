"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({ name: z.string().min(2, "Nome muito curto") });

export type CategoryState = { error?: string; success?: boolean };

export async function createCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "Não autorizado." };

  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const exists = await prisma.category.findUnique({
    where: { name: parsed.data.name },
  });
  if (exists) return { error: "Já existe uma categoria com esse nome." };

  await prisma.category.create({ data: { name: parsed.data.name } });
  revalidatePath("/categorias");
  return { success: true };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return;
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
}
