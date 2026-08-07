import { prisma } from "@/lib/prisma";
import { destroySession, getSession, type SessionPayload } from "@/lib/auth";
import { mustCompleteSubscription } from "@/lib/trial";

export type ActiveTenantSession = SessionPayload & { tenantId: string };

/**
 * Erro "esperado" de autorização: as server actions capturam essa mensagem
 * e a devolvem ao formulário, sem expor detalhes internos.
 */
export class SessionGuardError extends Error {}

/**
 * Revalida a sessão de loja contra o banco a cada operação sensível.
 *
 * O JWT de sessão fica válido por até 8h e, sozinho, não reflete mudanças
 * feitas depois de emitido (usuário desativado/excluído, loja suspensa,
 * assinatura vencida). Esta função consulta o estado atual e bloqueia (ou
 * encerra) a sessão quando ele não é mais válido, evitando que uma sessão
 * antiga continue autorizando ações por horas após o bloqueio.
 */
export async function requireActiveTenantSession(): Promise<ActiveTenantSession> {
  const session = await getSession();
  if (!session?.tenantId) {
    throw new SessionGuardError("Não autorizado.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { subscription: true },
  });
  if (!tenant || !tenant.active) {
    await destroySession();
    throw new SessionGuardError("Loja inativa. Fale com o suporte.");
  }

  // Suporte da plataforma: o dono "entra" na loja sem um User da própria loja.
  if (session.supportMode) {
    const supportUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!supportUser?.active || !supportUser.isPlatformAdmin) {
      await destroySession();
      throw new SessionGuardError("Sessão inválida. Faça login novamente.");
    }
    return session as ActiveTenantSession;
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (
    !user ||
    !user.active ||
    user.tenantId !== session.tenantId ||
    user.role !== session.role
  ) {
    await destroySession();
    throw new SessionGuardError("Sessão inválida. Faça login novamente.");
  }

  const sub = tenant.subscription;
  if (!sub || sub.status === "SUSPENDED" || sub.status === "CANCELLED") {
    await destroySession();
    throw new SessionGuardError(
      "Assinatura suspensa ou cancelada. Fale com o suporte.",
    );
  }

  if (mustCompleteSubscription(sub)) {
    throw new SessionGuardError(
      "Assinatura pendente. Regularize o pagamento em /assinatura para continuar.",
    );
  }

  return session as ActiveTenantSession;
}

/** Exige ADMIN da loja com sessão revalidada no banco (ver requireActiveTenantSession). */
export async function requireActiveTenantAdmin(): Promise<ActiveTenantSession> {
  const session = await requireActiveTenantSession();
  if (session.role !== "ADMIN") {
    throw new SessionGuardError("Não autorizado.");
  }
  return session;
}

/**
 * Igual a requireActiveTenantSession, mas não bloqueia por assinatura pendente
 * (usado por ações que a própria tela de assinatura precisa executar, ou por
 * leituras de baixo risco onde recusar friamente pioraria a experiência sem
 * ganho de segurança relevante). Ainda assim, sempre bloqueia usuário/loja
 * inativos e assinatura suspensa/cancelada.
 */
export async function requireActiveTenantSessionIgnoringBilling(): Promise<ActiveTenantSession> {
  const session = await getSession();
  if (!session?.tenantId) {
    throw new SessionGuardError("Não autorizado.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { subscription: true },
  });
  if (!tenant || !tenant.active) {
    await destroySession();
    throw new SessionGuardError("Loja inativa. Fale com o suporte.");
  }

  if (session.supportMode) {
    const supportUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!supportUser?.active || !supportUser.isPlatformAdmin) {
      await destroySession();
      throw new SessionGuardError("Sessão inválida. Faça login novamente.");
    }
    return session as ActiveTenantSession;
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (
    !user ||
    !user.active ||
    user.tenantId !== session.tenantId ||
    user.role !== session.role
  ) {
    await destroySession();
    throw new SessionGuardError("Sessão inválida. Faça login novamente.");
  }

  const sub = tenant.subscription;
  if (!sub || sub.status === "SUSPENDED" || sub.status === "CANCELLED") {
    await destroySession();
    throw new SessionGuardError(
      "Assinatura suspensa ou cancelada. Fale com o suporte.",
    );
  }

  return session as ActiveTenantSession;
}
