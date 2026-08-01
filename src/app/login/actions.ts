"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Informe usuário e senha." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active) {
    return { error: "Usuário ou senha inválidos." };
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return { error: "Usuário ou senha inválidos." };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role as "ADMIN" | "CAIXA",
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", detail: `Login de ${user.username}` },
  });

  redirect(user.role === "ADMIN" ? "/" : "/vendas");
}
