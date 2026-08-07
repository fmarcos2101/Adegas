import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { getPaymentSettingsForForm } from "./actions";
import { PaymentSettingsForm } from "./payment-settings-form";
import { CopyBlock } from "./copy-block";
import {
  getPaymentSettings,
  isProviderConfigured,
  PROVIDER_LABELS,
} from "@/lib/payment-settings";
import { getTerminalApiPort } from "@/lib/payment-terminal";
import { MERCADOPAGO_WEBHOOK_PATH } from "@/lib/mercadopago-point";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PagamentosPage() {
  const session = await getSession();
  if (!session?.tenantId) return null;

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${proto}://${host}` : `http://localhost:${getTerminalApiPort()}`;

  const settings = await getPaymentSettings(session.tenantId);
  const formData = await getPaymentSettingsForForm();
  const active = settings.activeProvider;
  const configured = isProviderConfigured(settings, active);

  const webhookUrls = {
    mercadopago: `${baseUrl}${MERCADOPAGO_WEBHOOK_PATH}`,
    sumup: `${baseUrl}/api/pagamentos/sumup/webhook`,
    ton: `${baseUrl}/api/pagamentos/ton/webhook`,
    generic: `${baseUrl}/api/pagamentos/terminal/callback`,
  };

  const callbackExample = `curl -X POST "${webhookUrls.generic}" \\
  -H "Content-Type: application/json" \\
  -H "X-Terminal-Key: SUA_CHAVE" \\
  -d '{"paymentRef":"ABC12345","amount":49.90,"method":"CREDITO","status":"APPROVED"}'`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Pagamentos — Maquininhas</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Escolha a maquininha e cole as credenciais quando tiver. Até lá, use{" "}
          <strong>dinheiro/PIX</strong> ou <strong>liberação manual</strong> no PDV.
        </p>
      </div>

      <Card className={configured || active === "GENERIC" ? "border-emerald-200 bg-emerald-950/40/50" : "border-amber-200 bg-amber-950/40/50"}>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Provedor ativo: <strong>{PROVIDER_LABELS[active]}</strong>
            {" — "}
            {active === "GENERIC" || configured ? (
              <span className="text-emerald-300">pronto para usar</span>
            ) : (
              <span className="text-amber-200">aguardando credenciais (salve abaixo quando tiver)</span>
            )}
          </p>
          <p className="mt-2 text-neutral-600">
            No PDV: débito/crédito → marque &quot;Cobrar na maquininha&quot; → referência aparece na tela →
            pagamento confirma automaticamente ou via <strong>Liberar manualmente</strong>.
          </p>
        </CardContent>
      </Card>

      {formData ? (
        <PaymentSettingsForm
          initial={formData}
          webhookUrls={webhookUrls}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Como funciona cada maquininha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300">
          <div>
            <p className="font-medium">Mercado Pago Point</p>
            <p className="text-neutral-600">
              Com token + terminal ID, o PDV cria uma order e a maquininha carrega sozinha. Webhook libera a venda.
            </p>
          </div>
          <div>
            <p className="font-medium">SumUp / Ton (Stone)</p>
            <p className="text-neutral-600">
              Gera referência no PDV. Quando integrar, configure o webhook para enviar confirmação com a mesma
              referência e valor. Até lá: liberação manual.
            </p>
          </div>
          <div>
            <p className="font-medium">API genérica</p>
            <p className="text-neutral-600">
              Qualquer automação ou maquininha que consiga POST HTTP com a referência da venda.
            </p>
            <CopyBlock label="Exemplo callback" code={callbackExample} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
