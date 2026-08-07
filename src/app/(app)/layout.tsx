import { redirect } from "next/navigation";
import { format } from "date-fns";
import { destroySession, getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SubscriptionGate } from "@/components/subscription-gate";
import { TrialBanner } from "@/components/trial-banner";
import { prisma } from "@/lib/prisma";
import {
  expireTrialIfNeeded,
  mustCompleteSubscription,
  trialDaysRemaining,
  isTrialStillValid,
} from "@/lib/trial";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.tenantId) redirect("/plataforma");

  // Revalida contra o banco: um JWT emitido antes de o usuário ser
  // desativado/excluído ou a loja ser suspensa não deve continuar
  // liberando o acesso pelas próximas horas até expirar.
  if (!session.supportMode) {
    const [user, tenant] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.userId } }),
      prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    ]);
    if (
      !user ||
      !user.active ||
      user.tenantId !== session.tenantId ||
      user.role !== session.role ||
      !tenant ||
      !tenant.active
    ) {
      await destroySession();
      redirect("/login");
    }
  }

  const subscription = session.supportMode
    ? await prisma.subscription.findUnique({
        where: { tenantId: session.tenantId },
      })
    : await expireTrialIfNeeded(session.tenantId);

  if (
    !session.supportMode &&
    (subscription?.status === "SUSPENDED" || subscription?.status === "CANCELLED")
  ) {
    await destroySession();
    redirect("/login");
  }

  const needsPay =
    !session.supportMode && mustCompleteSubscription(subscription);

  const showTrialBanner =
    session.role === "ADMIN" &&
    !session.supportMode &&
    subscription &&
    isTrialStillValid(subscription);

  const daysLeft = showTrialBanner
    ? trialDaysRemaining(subscription.trialEndsAt)
    : 0;

  return (
    <AppShell
      role={session.role}
      userName={session.name}
      storeName={session.tenantName}
      supportMode={session.supportMode}
    >
      <div className="space-y-4">
        {showTrialBanner && subscription?.trialEndsAt ? (
          <TrialBanner
            daysLeft={daysLeft}
            trialEndsAtLabel={format(subscription.trialEndsAt, "dd/MM/yyyy")}
          />
        ) : null}
        <SubscriptionGate
          needsPay={needsPay}
          supportMode={session.supportMode}
        >
          {children}
        </SubscriptionGate>
      </div>
    </AppShell>
  );
}
