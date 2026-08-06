import type { Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Período de teste grátis padrão (dias). */
export const TRIAL_DAYS = 7;

export function computeTrialEnd(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + TRIAL_DAYS);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function trialDaysRemaining(trialEndsAt: Date | null | undefined): number {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function isTrialStillValid(
  subscription: Pick<Subscription, "status" | "trialEndsAt"> | null | undefined,
): boolean {
  if (!subscription) return false;
  if (subscription.status !== "TRIALING") return false;
  if (!subscription.trialEndsAt) return false;
  return subscription.trialEndsAt.getTime() >= Date.now();
}

/**
 * Acesso liberado se:
 * - ACTIVE
 * - TRIALING com trialEndsAt no futuro
 * - PAST_DUE (grace — ainda pode logar; UI força assinatura)
 * Bloqueado: SUSPENDED, CANCELLED, trial expirado.
 */
export function isSubscriptionAccessAllowed(
  subscription:
    | Pick<Subscription, "status" | "trialEndsAt">
    | null
    | undefined,
  activeTenant: boolean,
): boolean {
  if (!activeTenant) return false;
  if (!subscription) return false;

  const { status } = subscription;
  if (status === "SUSPENDED" || status === "CANCELLED") return false;

  if (status === "TRIALING") {
    return isTrialStillValid(subscription);
  }

  // ACTIVE e PAST_DUE: permite login (PAST_DUE redireciona para /assinatura)
  return status === "ACTIVE" || status === "PAST_DUE";
}

/** Trial ou cobrança atrasada: admin só pode usar a tela de assinatura. */
export function mustCompleteSubscription(
  subscription:
    | Pick<Subscription, "status" | "trialEndsAt">
    | null
    | undefined,
): boolean {
  if (!subscription) return true;
  if (subscription.status === "PAST_DUE") return true;
  if (subscription.status === "TRIALING" && !isTrialStillValid(subscription)) {
    return true;
  }
  return false;
}

/**
 * Se o trial expirou, marca a assinatura como PAST_DUE.
 * Retorna a assinatura atualizada (ou a original).
 */
export async function expireTrialIfNeeded(
  tenantId: string,
): Promise<Subscription | null> {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) return null;

  if (
    sub.status === "TRIALING" &&
    sub.trialEndsAt &&
    sub.trialEndsAt.getTime() < Date.now()
  ) {
    const updated = await prisma.subscription.update({
      where: { tenantId },
      data: { status: "PAST_DUE" },
    });
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "TRIAL_EXPIRADO",
        detail: `Trial de ${TRIAL_DAYS} dias encerrado em ${sub.trialEndsAt.toISOString()}`,
      },
    });
    return updated;
  }

  return sub;
}
