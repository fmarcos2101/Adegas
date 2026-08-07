"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Se o trial expirou ou o pagamento está atrasado, mantém o admin
 * apenas em /assinatura até regularizar.
 */
export function SubscriptionGate({
  needsPay,
  supportMode,
  children,
}: {
  needsPay: boolean;
  supportMode?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (supportMode || !needsPay) return;
    if (!pathname.startsWith("/assinatura")) {
      router.replace("/assinatura");
    }
  }, [needsPay, supportMode, pathname, router]);

  if (
    needsPay &&
    !supportMode &&
    pathname &&
    !pathname.startsWith("/assinatura")
  ) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
        Período de teste encerrado. Redirecionando para a assinatura…
      </div>
    );
  }

  return <>{children}</>;
}
