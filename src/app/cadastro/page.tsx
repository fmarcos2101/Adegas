import Link from "next/link";
import { CadastroForm } from "./cadastro-form";
import { APP_NAME, TRIAL_DAYS } from "@/lib/constants";
import { getPlatformBilling } from "@/lib/platform-billing";

export default async function CadastroPage() {
  const billing = await getPlatformBilling();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0f766e_0%,_transparent_55%),linear-gradient(160deg,#0f172a_0%,#134e4a_45%,#0f172a_100%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-6 font-display text-sm font-semibold text-teal-200/90 hover:text-white"
        >
          ← {APP_NAME}
        </Link>
        <div className="rounded-xl border border-teal-800/40 bg-white/95 p-6 shadow-2xl shadow-teal-950/40 backdrop-blur sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Crie sua loja
          </h1>
          <p className="mt-1 text-sm text-slate-500">
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
