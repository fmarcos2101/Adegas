import Link from "next/link";
import { CadastroForm } from "./cadastro-form";
import { APP_NAME, TRIAL_DAYS } from "@/lib/constants";
import { getPlatformBilling } from "@/lib/platform-billing";

export default async function CadastroPage() {
  const billing = await getPlatformBilling();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="maf-smoke absolute inset-0" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white"
        >
          <img src="/logo-maf.svg" alt="" width={40} height={24} className="h-6 w-auto" />
          <span className="font-display tracking-[0.14em]">{APP_NAME}</span>
        </Link>
        <div className="maf-panel rounded-xl p-6 shadow-2xl shadow-black/50 sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Crie sua loja
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {TRIAL_DAYS} dias grátis · depois assine pelo painel com Mercado Pago
          </p>
          <div className="mt-6">
            <CadastroForm
              basicPrice={billing.basicPrice}
              proPrice={billing.proPrice}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
