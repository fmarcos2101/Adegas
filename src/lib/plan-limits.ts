import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Limite de PDVs ativos por plano.
 * Um PDV = um usuário com perfil CAIXA ativo (cada caixa opera um ponto de venda).
 * O ADMIN da loja sempre pode abrir o PDV e não consome vaga.
 */
export const PLAN_MAX_PDV: Record<SubscriptionPlan, number> = {
  TRIAL: 1,
  BASIC: 1,
  PLUS: 3,
  PRO: 3,
};

export function maxPdvForPlan(plan: SubscriptionPlan | string | null | undefined): number {
  if (!plan) return PLAN_MAX_PDV.BASIC;
  return PLAN_MAX_PDV[plan as SubscriptionPlan] ?? PLAN_MAX_PDV.BASIC;
}

export async function countActivePdvUsers(tenantId: string): Promise<number> {
  return prisma.user.count({
    where: { tenantId, role: "CAIXA", active: true },
  });
}

export async function getPdvUsage(tenantId: string): Promise<{
  used: number;
  max: number;
  plan: SubscriptionPlan;
  remaining: number;
}> {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  const plan = sub?.plan ?? "TRIAL";
  const max = maxPdvForPlan(plan);
  const used = await countActivePdvUsers(tenantId);
  return { used, max, plan, remaining: Math.max(0, max - used) };
}

/**
 * Verifica se pode adicionar/ativar mais um CAIXA.
 * excludeUserId: ao reativar, não contar o próprio usuário se já estiver ativo
 * (na prática ao ativar ele está inativo, então não está no count).
 */
export async function canAddPdvUser(
  tenantId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const usage = await getPdvUsage(tenantId);
  const used = usage.used;

  if (used >= usage.max) {
    const planLabel =
      usage.plan === "BASIC"
        ? "Básico (1 PDV)"
        : usage.plan === "PLUS" || usage.plan === "PRO"
          ? "Plus/Pro (até 3 PDVs)"
          : `Trial (1 PDV)`;
    return {
      ok: false,
      error: `Limite de PDVs do plano atingido (${used}/${usage.max}). Plano atual: ${planLabel}. Faça upgrade ou inative outro caixa.`,
    };
  }
  return { ok: true };
}
