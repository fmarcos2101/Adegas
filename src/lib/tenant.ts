import { redirect } from "next/navigation";
import type { SubscriptionStatus } from "@prisma/client";
import { getSession, type SessionPayload } from "@/lib/auth";
import { isSubscriptionAccessAllowed as trialAccessAllowed } from "@/lib/trial";

export type TenantSession = SessionPayload & { tenantId: string };

/** Exige sessão autenticada (loja ou plataforma). */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Exige super-admin da plataforma (painel /plataforma). */
export async function requirePlatformAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!session.isPlatformAdmin) redirect("/dashboard");
  return session;
}

/**
 * Exige contexto de loja (tenant).
 * Super-admin sem loja selecionada é redirecionado ao painel da plataforma.
 */
export async function requireTenantSession(): Promise<TenantSession> {
  const session = await requireSession();
  if (!session.tenantId) {
    if (session.isPlatformAdmin) redirect("/plataforma");
    redirect("/login");
  }
  return session as TenantSession;
}

/** @deprecated use isSubscriptionAccessAllowed de @/lib/trial */
export function isSubscriptionAccessAllowed(
  status: SubscriptionStatus | undefined | null,
  activeTenant: boolean,
  trialEndsAt?: Date | null,
): boolean {
  if (!status) return false;
  return trialAccessAllowed(
    { status, trialEndsAt: trialEndsAt ?? null },
    activeTenant,
  );
}
