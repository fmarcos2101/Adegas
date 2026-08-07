"use server";

import { redirect } from "next/navigation";
import type { SubscriptionPlan } from "@prisma/client";
import { createSession } from "@/lib/auth";
import { createTenantWithAdmin, slugSchema } from "@/lib/create-tenant";
import { getPlatformBilling, priceForPlan } from "@/lib/platform-billing";

export type CadastroState = { error?: string };

export async function cadastroAction(
  _prev: CadastroState,
  formData: FormData,
): Promise<CadastroState> {
  const storeName = String(formData.get("storeName") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminUser = String(formData.get("adminUser") ?? "admin").trim();
  const adminPass = String(formData.get("adminPass") ?? "");
  const adminPassConfirm = String(formData.get("adminPassConfirm") ?? "");
  const planRaw = String(formData.get("plan") ?? "BASIC");
  const plan = (
    ["BASIC", "PLUS", "PRO"].includes(planRaw) ? planRaw : "BASIC"
  ) as SubscriptionPlan;

  if (!storeName) return { error: "Informe o nome do seu negócio." };
  const slugParsed = slugSchema.safeParse(slugRaw);
  if (!slugParsed.success) {
    return {
      error:
        slugParsed.error.issues[0]?.message ??
        "Código da loja inválido (ex.: minha-loja).",
    };
  }
  if (!adminName) return { error: "Informe seu nome." };
  if (adminPass !== adminPassConfirm) {
    return { error: "As senhas não coincidem." };
  }

  const billing = await getPlatformBilling();
  const priceMonthly = priceForPlan(billing, plan);

  const result = await createTenantWithAdmin({
    name: storeName,
    slug: slugParsed.data,
    adminUser,
    adminPass,
    adminName,
    plan,
    priceMonthly,
    auditAction: "TENANT_SELF_SIGNUP",
    auditDetail: `Auto-cadastro da loja ${slugParsed.data} (plano pretendido ${plan})`,
  });

  if (!result.ok) return { error: result.error };

  await createSession({
    userId: result.admin.id,
    username: result.admin.username,
    name: result.admin.name,
    role: "ADMIN",
    tenantId: result.tenant.id,
    tenantSlug: result.tenant.slug,
    tenantName: result.tenant.name,
    isPlatformAdmin: false,
    supportMode: false,
  });

  redirect("/dashboard");
}
