"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/tenant";
import { createTenantWithAdmin, slugSchema } from "@/lib/create-tenant";
import { TRIAL_DAYS } from "@/lib/trial";

export type PlatformActionState = { error?: string; success?: string };

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

  if (!slugParsed.success) {
    return { error: slugParsed.error.issues[0]?.message ?? "Slug inválido." };
  }

  const result = await createTenantWithAdmin({
    name,
    slug: slugParsed.data,
    adminUser,
    adminPass,
    plan,
    priceMonthly,
    actorUserId: session.userId,
    auditAction: "TENANT_CREATE",
    auditDetail: `Loja ${slugParsed.data} (${name}) criada pela plataforma`,
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/plataforma");
  return {
    success: `Loja "${result.tenant.name}" criada. Código: ${result.tenant.slug}. Teste grátis de ${TRIAL_DAYS} dias até ${result.trialEndsAt.toLocaleDateString("pt-BR")}.`,
  };
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

  redirect("/dashboard");
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

/** Suspende ou reativa a loja rapidamente (lista ou detalhe). */
export async function setTenantActiveAction(tenantId: string, active: boolean) {
  const session = await requirePlatformAdmin();
  if (!tenantId) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });
  if (!tenant) return;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { active },
  });

  if (tenant.subscription) {
    if (!active && tenant.subscription.status !== "CANCELLED") {
      await prisma.subscription.update({
        where: { tenantId },
        data: { status: "SUSPENDED" },
      });
    }
    if (active && tenant.subscription.status === "SUSPENDED") {
      const restore =
        tenant.subscription.mpPreapprovalId || tenant.subscription.priceMonthly > 0
          ? "ACTIVE"
          : "TRIALING";
      await prisma.subscription.update({
        where: { tenantId },
        data: { status: restore },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: session.userId,
      action: active ? "TENANT_ACTIVATE" : "TENANT_SUSPEND",
      detail: `Loja ${tenant.slug} ${active ? "reativada" : "suspensa"} pela plataforma`,
    },
  });

  revalidatePath("/plataforma");
  revalidatePath(`/plataforma/lojas/${tenantId}`);
  revalidatePath("/plataforma/atividade");
}

export async function updateTenantProfileAction(
  _prev: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  const session = await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!tenantId) return { error: "Loja inválida." };
  if (!name) return { error: "Informe o nome da loja." };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Loja não encontrada." };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { name, notes },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: session.userId,
      action: "TENANT_UPDATE",
      detail: `Perfil da loja ${tenant.slug} atualizado (${name})`,
    },
  });

  revalidatePath("/plataforma");
  revalidatePath(`/plataforma/lojas/${tenantId}`);
  revalidatePath("/plataforma/atividade");
  return { success: "Dados da loja salvos." };
}
