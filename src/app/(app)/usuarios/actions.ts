"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  username: z.string().min(3, "Usuário muito curto"),
  password: z.string().min(4, "Senha deve ter ao menos 4 caracteres"),
  role: z.enum(["ADMIN", "CAIXA"]),
});

export type UserState = { error?: string; success?: boolean };

export async function createUser(
  _prev: UserState,
  formData: FormData,
): Promise<UserState> {
  const session = await getSession();
  if (!session?.tenantId || session.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }
  const tenantId = session.tenantId;

  const parsed = schema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { name, username, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({
    where: { tenantId_username: { tenantId, username } },
  });
  if (exists) return { error: "Nome de usuário já existe." };

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
      action: "CRIAR_USUARIO",
      detail: `Usuário ${username} (${role}) criado`,
    },
  });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.tenantId || session.role !== "ADMIN") return;
  const tenantId = session.tenantId;

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (id === session.userId) return;

  const user = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!user) return;

  if (user.active && user.role === "ADMIN") {
    const activeAdmins = await prisma.user.count({
      where: { tenantId, role: "ADMIN", active: true },
    });
    if (activeAdmins <= 1) return;
  }

  await prisma.user.update({
    where: { id },
    data: { active: !user.active },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: session.userId,
      action: user.active ? "INATIVAR_USUARIO" : "ATIVAR_USUARIO",
      detail: `Usuário ${user.username}`,
    },
  });

  revalidatePath("/usuarios");
}
