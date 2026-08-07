import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, LayoutDashboard, LogOut } from "lucide-react";
import { destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(app)/actions";
import {
  expireTrialIfNeeded,
  mustCompleteSubscription,
} from "@/lib/trial";

export default async function PdvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.tenantId) redirect("/login");

  if (!session.supportMode) {
    const [user, tenant, subscription] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.userId } }),
      prisma.tenant.findUnique({ where: { id: session.tenantId } }),
      expireTrialIfNeeded(session.tenantId),
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

    if (subscription?.status === "SUSPENDED" || subscription?.status === "CANCELLED") {
      await destroySession();
      redirect("/login");
    }

    if (mustCompleteSubscription(subscription)) {
      redirect(session.role === "ADMIN" ? "/assinatura" : "/login");
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--maf-void)]">
      <BrandHeader
        brandName={session.tenantName ?? undefined}
        subtitle="PDV — Ponto de Venda"
      >
        <Link href="/estoque" target="_blank">
          <Button
            variant="outline"
            size="sm"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            <Boxes className="h-4 w-4" />
            Estoque
          </Button>
        </Link>
        {session.role === "ADMIN" ? (
          <Link href="/dashboard" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <LayoutDashboard className="h-4 w-4" />
              Painel
            </Button>
          </Link>
        ) : null}
        <span className="text-sm font-medium text-white/90">{session.name}</span>
        <form action={logoutAction}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </BrandHeader>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
