import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(app)/actions";
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
    <div className="flex min-h-screen flex-col bg-slate-100">
      <BrandHeader subtitle="Cobrança automática — Mercado Pago">
        <span className="hidden text-sm text-white/90 sm:inline">
          {session.name}
        </span>
        <form action={logoutAction}>
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </BrandHeader>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 sm:p-8">
        <div>
          <Link
            href="/plataforma"
            className="mb-2 inline-flex items-center gap-1 text-sm text-teal-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">
            Cobrança SaaS
          </h1>
          <p className="text-sm text-slate-500">
            Configure o Mercado Pago para cobrar as assinaturas do {APP_NAME}{" "}
            automaticamente todo mês.
          </p>
          <p
            className={`mt-2 text-sm font-medium ${configured ? "text-teal-700" : "text-amber-700"}`}
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

        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Como funciona</p>
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
      </main>
    </div>
  );
}
