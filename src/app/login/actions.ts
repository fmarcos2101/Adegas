"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { PLATFORM_SLUG } from "@/lib/constants";
import {
  expireTrialIfNeeded,
  mustCompleteSubscription,
  TRIAL_DAYS,
} from "@/lib/trial";

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
  });

  if (!tenant) {
    return { error: "Loja não encontrada. Verifique o código." };
  }

  if (!tenant.active) {
    return { error: "Esta loja está inativa. Fale com o suporte." };
  }

  // Expira trial de 7 dias se passou do prazo (TRIALING → PAST_DUE)
  const subscription = await expireTrialIfNeeded(tenant.id);
  if (!subscription) {
    return { error: "Loja sem assinatura configurada. Fale com o suporte." };
  }

  if (
    subscription.status === "SUSPENDED" ||
    subscription.status === "CANCELLED"
  ) {
    return {
      error:
        "Esta loja está com assinatura suspensa ou cancelada. Fale com o suporte.",
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

  const needsPay = mustCompleteSubscription(subscription);

  if (needsPay && user.role !== "ADMIN") {
    return {
      error: `Período de teste de ${TRIAL_DAYS} dias encerrado. O administrador precisa assinar o plano.`,
    };
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

  if (needsPay) {
    redirect("/assinatura");
  }

  redirect(user.role === "ADMIN" ? "/" : "/pdv");
}
