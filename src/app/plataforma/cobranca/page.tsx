import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PlatformShell } from "@/components/plataforma/platform-shell";
import {
  getPlatformBilling,
  isPlatformBillingConfigured,
} from "@/lib/platform-billing";
import { maskSecret } from "@/lib/payment-settings";
import { BillingSettingsForm } from "./billing-form";
import { getBillingWebhookUrl } from "./actions";
import { APP_NAME } from "@/lib/constants";

export default async function CobrancaPage() {
  const session = await getSession();
  if (!session?.isPlatformAdmin) redirect("/login");

  const billing = await getPlatformBilling();
  const webhookUrl = await getBillingWebhookUrl();
  const configured = isPlatformBillingConfigured(billing);

  return (
    <PlatformShell
      userName={session.name}
      subtitle="Cobrança automática — Mercado Pago"
      activePath="/plataforma/cobranca"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900">
            Cobrança SaaS
          </h1>
          <p className="text-sm text-zinc-400">
            Configure o Mercado Pago para cobrar as assinaturas do {APP_NAME}{" "}
            automaticamente todo mês.
          </p>
          <p
            className={`mt-2 text-sm font-medium ${configured ? "text-zinc-800" : "text-amber-700"}`}
          >
            {configured
              ? "Mercado Pago configurado — pronto para gerar links."
              : "Ainda sem Access Token — cole as credenciais abaixo."}
          </p>
        </div>

        <BillingSettingsForm
          mpAccessTokenMasked={maskSecret(billing.mpAccessToken)}
          hasToken={Boolean(billing.mpAccessToken)}
          hasWebhookSecret={Boolean(billing.mpWebhookSecret)}
          basicPrice={billing.basicPrice}
          proPrice={billing.proPrice}
          webhookUrl={webhookUrl}
        />

        <div className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-400">
          <p className="font-medium text-zinc-900">Como funciona</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Salve o Access Token da sua conta Mercado Pago.</li>
            <li>
              No painel do MP, cadastre o webhook com a URL acima e os tópicos de
              Assinaturas.
            </li>
            <li>
              Em cada loja, gere o link de cobrança (e-mail do cliente + plano).
            </li>
            <li>
              O cliente autoriza o cartão no checkout do MP; as mensalidades
              passam a ser cobradas sozinhas.
            </li>
          </ol>
        </div>
      </div>
    </PlatformShell>
  );
}
