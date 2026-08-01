import { Pdv } from "./pdv";
import { getActiveTerminalProvider } from "@/lib/payment-providers";

export default async function PdvPage() {
  const terminal = await getActiveTerminalProvider();
  return (
    <div className="mx-auto max-w-6xl">
      <Pdv terminal={terminal} />
    </div>
  );
}
