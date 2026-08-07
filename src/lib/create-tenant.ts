import bcrypt from "bcryptjs";
import { z } from "zod";
import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLATFORM_SLUG } from "@/lib/constants";
import { computeTrialEnd, TRIAL_DAYS } from "@/lib/trial";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Código muito curto")
  .max(40, "Código muito longo")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras, números e hífens");

/** Slugs que não podem ser usados como código de loja. */
export const RESERVED_SLUGS = new Set([
  PLATFORM_SLUG,
  "login",
  "cadastro",
  "dashboard",
  "pdv",
  "api",
  "assinatura",
  "produtos",
  "categorias",
  "estoque",
  "relatorios",
  "usuarios",
  "auditoria",
  "backup",
  "pagamentos",
  "www",
  "admin",
  "app",
  "suporte",
  "help",
  "nexopdv",
  "mafpdv",
  "maf",
  "pricing",
  "precos",
]);

export type CreateTenantInput = {
  name: string;
  slug: string;
  adminUser: string;
  adminPass: string;
  adminName?: string;
  plan?: SubscriptionPlan;
  priceMonthly?: number;
  /** Quem criou (auditoria). Null = auto-cadastro. */
  actorUserId?: string | null;
  auditAction?: string;
  auditDetail?: string;
};

export type CreateTenantResult =
  | {
      ok: true;
      tenant: { id: string; name: string; slug: string };
      admin: { id: string; username: string; name: string };
      trialEndsAt: Date;
    }
  | { ok: false; error: string };

export async function createTenantWithAdmin(
  input: CreateTenantInput,
): Promise<CreateTenantResult> {
  const name = input.name.trim();
  const slugParsed = slugSchema.safeParse(input.slug);
  const adminUser =
    String(input.adminUser ?? "admin").trim().toLowerCase() || "admin";
  const adminPass = String(input.adminPass ?? "").trim();
  const adminName = (input.adminName ?? "Administrador").trim() || "Administrador";
  const plan = (input.plan ?? "TRIAL") as SubscriptionPlan;
  const priceMonthly = Number(input.priceMonthly ?? 0);

  if (!name) return { ok: false, error: "Informe o nome da loja." };
  if (!slugParsed.success) {
    return {
      ok: false,
      error: slugParsed.error.issues[0]?.message ?? "Código inválido.",
    };
  }
  const slug = slugParsed.data;
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: "Este código é reservado. Escolha outro." };
  }
  if (!adminPass || adminPass.length < 4) {
    return { ok: false, error: "Defina uma senha (mín. 4 caracteres)." };
  }
  if (adminUser.length < 2) {
    return { ok: false, error: "Usuário admin muito curto." };
  }

  const exists = await prisma.tenant.findUnique({ where: { slug } });
  if (exists) return { ok: false, error: "Já existe uma loja com este código." };

  const trialEnd = computeTrialEnd();
  const passwordHash = await bcrypt.hash(adminPass, 10);
  const intendedPlan = plan === "TRIAL" ? "TRIAL" : plan;

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      active: true,
      subscription: {
        create: {
          plan: intendedPlan,
          status: "TRIALING",
          priceMonthly: Number.isFinite(priceMonthly) ? priceMonthly : 0,
          trialEndsAt: trialEnd,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
          notes: `Teste grátis de ${TRIAL_DAYS} dias`,
        },
      },
      paymentSettings: { create: { activeProvider: "GENERIC" } },
      users: {
        create: {
          username: adminUser,
          name: adminName,
          password: passwordHash,
          role: "ADMIN",
        },
      },
    },
    include: { users: { where: { role: "ADMIN" }, take: 1 } },
  });

  const admin = tenant.users[0];
  if (!admin) {
    return { ok: false, error: "Falha ao criar usuário administrador." };
  }

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: input.actorUserId ?? admin.id,
      action: input.auditAction ?? "TENANT_CREATE",
      detail:
        input.auditDetail ??
        `Loja ${tenant.slug} (${tenant.name}) criada`,
    },
  });

  return {
    ok: true,
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    admin: { id: admin.id, username: admin.username, name: admin.name },
    trialEndsAt: trialEnd,
  };
}
