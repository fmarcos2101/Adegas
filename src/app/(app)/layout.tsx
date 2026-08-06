import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.tenantId) redirect("/plataforma");

  return (
    <AppShell
      role={session.role}
      userName={session.name}
      storeName={session.tenantName}
      supportMode={session.supportMode}
    >
      {children}
    </AppShell>
  );
}
