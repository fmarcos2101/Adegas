"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { PLATFORM_SLUG } from "@/lib/constants";
import { isSubscriptionAccessAllowed } from "@/lib/tenant";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const storeCode = String(formData.get("storeCode") ?? "")
    .trim()
    .toLowerCase();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Informe usuário e senha." };
  }

  // Acesso à plataforma: código vazio ou "plataforma"
  if (!storeCode || storeCode === PLATFORM_SLUG) {
    const user = await prisma.user.findFirst({
      where: { username, isPlatformAdmin: true, active: true },
    });
    if (!user) {
      return {
        error: storeCode
          ? "Usuário ou senha inválidos."
          : "Para acessar uma loja, informe o código. Para a plataforma, use a conta do dono.",
      };
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return { error: "Usuário ou senha inválidos." };

    await createSession({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: "ADMIN",
      tenantId: null,
      tenantSlug: null,
      tenantName: null,
      isPlatformAdmin: true,
      supportMode: false,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN_PLATAFORMA",
        detail: `Login plataforma de ${user.username}`,
      },
    });

    redirect("/plataforma");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: storeCode },
    include: { subscription: true },
  });

  if (!tenant) {
    return { error: "Loja não encontrada. Verifique o código." };
  }

  if (
    !isSubscriptionAccessAllowed(tenant.subscription?.status, tenant.active)
  ) {
    return {
      error:
        "Esta loja está inativa ou com assinatura suspensa. Fale com o suporte.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      tenantId_username: { tenantId: tenant.id, username },
    },
  });

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
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    isPlatformAdmin: false,
    supportMode: false,
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      action: "LOGIN",
      detail: `Login de ${user.username} na loja ${tenant.slug}`,
    },
  });

  redirect(user.role === "ADMIN" ? "/" : "/pdv");
}
