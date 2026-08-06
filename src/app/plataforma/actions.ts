"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/tenant";
import { PLATFORM_SLUG } from "@/lib/constants";

export type PlatformActionState = { error?: string; success?: string };

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug muito curto")
  .max(40, "Slug muito longo")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras, números e hífens");

export async function createTenantAction(
  _prev: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  const session = await requirePlatformAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugParsed = slugSchema.safeParse(formData.get("slug"));
  const adminUser = String(formData.get("adminUser") ?? "admin").trim() || "admin";
  const adminPass = String(formData.get("adminPass") ?? "").trim();
  const plan = String(formData.get("plan") ?? "TRIAL") as SubscriptionPlan;
  const priceMonthly = Number(formData.get("priceMonthly") ?? 0);

  if (!name) return { error: "Informe o nome da loja." };
  if (!slugParsed.success) {
    return { error: slugParsed.error.issues[0]?.message ?? "Slug inválido." };
  }
  const slug = slugParsed.data;
  if (slug === PLATFORM_SLUG) {
    return { error: "Este código é reservado para a plataforma." };
  }
  if (!adminPass || adminPass.length < 4) {
    return { error: "Defina uma senha inicial (mín. 4 caracteres)." };
  }

  const exists = await prisma.tenant.findUnique({ where: { slug } });
  if (exists) return { error: "Já existe uma loja com este código." };

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  const passwordHash = await bcrypt.hash(adminPass, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      active: true,
      subscription: {
        create: {
          plan,
          status: plan === "TRIAL" ? "TRIALING" : "ACTIVE",
          priceMonthly: Number.isFinite(priceMonthly) ? priceMonthly : 0,
          trialEndsAt: plan === "TRIAL" ? trialEnd : null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: plan === "TRIAL" ? trialEnd : addMonths(new Date(), 1),
        },
      },
      paymentSettings: { create: { activeProvider: "GENERIC" } },
      users: {
        create: {
          username: adminUser,
          name: "Administrador",
          password: passwordHash,
          role: "ADMIN",
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "TENANT_CREATE",
      detail: `Loja ${tenant.slug} (${tenant.name}) criada`,
    },
  });

  revalidatePath("/plataforma");
  return { success: `Loja "${tenant.name}" criada. Código: ${tenant.slug}` };
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function updateSubscriptionAction(
  _prev: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  const session = await requirePlatformAdmin();

  const tenantId = String(formData.get("tenantId") ?? "");
  const plan = String(formData.get("plan") ?? "BASIC") as SubscriptionPlan;
  const status = String(formData.get("status") ?? "ACTIVE") as SubscriptionStatus;
  const priceMonthly = Number(formData.get("priceMonthly") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!tenantId) return { error: "Loja inválida." };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Loja não encontrada." };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { active },
  });

  await prisma.subscription.upsert({
    where: { tenantId },
    update: {
      plan,
      status,
      priceMonthly: Number.isFinite(priceMonthly) ? priceMonthly : 0,
      notes,
      currentPeriodEnd:
        status === "ACTIVE" ? addMonths(new Date(), 1) : undefined,
    },
    create: {
      tenantId,
      plan,
      status,
      priceMonthly: Number.isFinite(priceMonthly) ? priceMonthly : 0,
      notes,
      currentPeriodStart: new Date(),
      currentPeriodEnd: addMonths(new Date(), 1),
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: session.userId,
      action: "SUBSCRIPTION_UPDATE",
      detail: `${tenant.slug}: ${plan}/${status} R$ ${priceMonthly} active=${active}`,
    },
  });

  revalidatePath("/plataforma");
  revalidatePath(`/plataforma/lojas/${tenantId}`);
  return { success: "Assinatura atualizada." };
}

export async function enterTenantSupportAction(tenantId: string) {
  const session = await requirePlatformAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    redirect("/plataforma");
  }

  await createSession({
    userId: session.userId,
    username: session.username,
    name: session.name,
    role: "ADMIN",
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    isPlatformAdmin: true,
    supportMode: true,
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.userId,
      action: "SUPPORT_ENTER",
      detail: `Suporte entrou na loja ${tenant.slug}`,
    },
  });

  redirect("/");
}

export async function exitSupportAction() {
  const session = await requirePlatformAdmin();

  await createSession({
    userId: session.userId,
    username: session.username,
    name: session.name,
    role: "ADMIN",
    tenantId: null,
    tenantSlug: null,
    tenantName: null,
    isPlatformAdmin: true,
    supportMode: false,
  });

  redirect("/plataforma");
}
