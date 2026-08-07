import { redirect } from "next/navigation";
import { Pdv } from "./pdv";
import { getActiveTerminalProvider } from "@/lib/payment-providers";
import { getSession } from "@/lib/auth";

export default async function PdvPage() {
  const session = await getSession();
  if (!session?.tenantId) redirect("/login");
  const terminal = await getActiveTerminalProvider(session.tenantId);
  return (
    <div className="mx-auto max-w-6xl">
      <Pdv terminal={terminal} />
    </div>
  );
}
