import { Pdv } from "./pdv";
import { isMercadoPagoConfigured } from "@/lib/mercadopago-point";

export default function PdvPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <Pdv mercadoPagoEnabled={isMercadoPagoConfigured()} />
    </div>
  );
}
