"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireActiveTenantAdmin } from "@/lib/session-guard";

const schema = z.object({ name: z.string().min(2, "Nome muito curto") });

export type CategoryState = { error?: string; success?: boolean };

export async function createCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  let tenantId: string;
  try {
    tenantId = (await requireActiveTenantAdmin()).tenantId;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não autorizado." };
  }

  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const exists = await prisma.category.findUnique({
    where: { tenantId_name: { tenantId, name: parsed.data.name } },
  });
  if (exists) return { error: "Já existe uma categoria com esse nome." };

  await prisma.category.create({
    data: { tenantId, name: parsed.data.name },
  });
  revalidatePath("/categorias");
  return { success: true };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  let tenantId: string;
  try {
    tenantId = (await requireActiveTenantAdmin()).tenantId;
  } catch {
    return;
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const category = await prisma.category.findFirst({
    where: { id, tenantId },
  });
  if (!category) return;

  const count = await prisma.product.count({
    where: { categoryId: id, tenantId },
  });
  if (count > 0) {
    return;
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
}
