"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/tenant";
import { canAddPdvUser } from "@/lib/plan-limits";

export type PlatformUserState = { error?: string; success?: string };

export async function platformCreateUserAction(
  _prev: PlatformUserState,
  formData: FormData,
): Promise<PlatformUserState> {
  const session = await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return { error: "Loja inválida." };

  const parsed = z
    .object({
      name: z.string().min(2, "Nome muito curto"),
      username: z.string().min(3, "Usuário muito curto"),
      password: z.string().min(4, "Senha deve ter ao menos 4 caracteres"),
      role: z.enum(["ADMIN", "CAIXA"]),
    })
    .safeParse({
      name: formData.get("name"),
      username: formData.get("username"),
      password: formData.get("password"),
      role: formData.get("role"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, username, password, role } = parsed.data;

  if (role === "CAIXA") {
    const seat = await canAddPdvUser(tenantId);
    if (!seat.ok) return { error: seat.error };
  }

  const exists = await prisma.user.findUnique({
    where: { tenantId_username: { tenantId, username } },
  });
  if (exists) return { error: "Nome de usuário já existe nesta loja." };

  await prisma.user.create({
    data: {
      tenantId,
      name,
      username,
      password: await bcrypt.hash(password, 10),
      role,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: session.userId,
      action: "PLATAFORMA_CRIAR_USUARIO",
      detail: `${username} (${role}) criado pelo suporte`,
    },
  });

  revalidatePath(`/plataforma/lojas/${tenantId}`);
  return { success: `Usuário ${username} criado.` };
}

export async function platformResetPasswordAction(
  _prev: PlatformUserState,
  formData: FormData,
): Promise<PlatformUserState> {
  const session = await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!tenantId || !userId) return { error: "Dados inválidos." };
  if (password.length < 4) {
    return { error: "Nova senha deve ter ao menos 4 caracteres." };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isPlatformAdmin: false },
  });
  if (!user) return { error: "Usuário não encontrado." };

  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(password, 10) },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: session.userId,
      action: "PLATAFORMA_RESET_SENHA",
      detail: `Senha de ${user.username} redefinida pelo suporte`,
    },
  });

  revalidatePath(`/plataforma/lojas/${tenantId}`);
  return { success: `Senha de ${user.username} redefinida.` };
}

export async function platformToggleUserAction(
  _prev: PlatformUserState,
  formData: FormData,
): Promise<PlatformUserState> {
  const session = await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!tenantId || !userId) return { error: "Dados inválidos." };

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isPlatformAdmin: false },
  });
  if (!user) return { error: "Usuário não encontrado." };

  // Ao ativar um CAIXA, respeita limite de PDV
  if (!user.active && user.role === "CAIXA") {
    const seat = await canAddPdvUser(tenantId);
    if (!seat.ok) return { error: seat.error };
  }

  if (user.active && user.role === "ADMIN") {
    const activeAdmins = await prisma.user.count({
      where: { tenantId, role: "ADMIN", active: true },
    });
    if (activeAdmins <= 1) {
      return { error: "Não é possível inativar o último administrador da loja." };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: session.userId,
      action: user.active
        ? "PLATAFORMA_INATIVAR_USUARIO"
        : "PLATAFORMA_ATIVAR_USUARIO",
      detail: `Usuário ${user.username}`,
    },
  });

  revalidatePath(`/plataforma/lojas/${tenantId}`);
  return {
    success: user.active
      ? `${user.username} inativado.`
      : `${user.username} ativado.`,
  };
}
