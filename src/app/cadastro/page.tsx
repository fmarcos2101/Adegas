import Link from "next/link";
import { CadastroForm } from "./cadastro-form";
import { APP_NAME, TRIAL_DAYS } from "@/lib/constants";
import { getPlatformBilling } from "@/lib/platform-billing";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const [billing, params] = await Promise.all([
    getPlatformBilling(),
    searchParams,
  ]);
  const planRaw = (params.plano ?? "BASIC").toUpperCase();
  const defaultPlan =
    planRaw === "PRO" || planRaw === "PLUS" || planRaw === "BASIC"
      ? planRaw
      : "BASIC";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(160,168,180,0.35),transparent_55%),linear-gradient(160deg,#f7f8fa_0%,#e6e8ee_50%,#f4f5f7_100%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-maf-icon.png" alt="" className="h-7 w-auto" />
          <span className="font-display tracking-[0.14em]">{APP_NAME}</span>
        </Link>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/10 sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
            Crie sua loja
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {TRIAL_DAYS} dias grátis · depois assine pelo painel com Mercado Pago
          </p>
          <div className="mt-6">
            <CadastroForm
              basicPrice={billing.basicPrice}
              proPrice={billing.proPrice}
              defaultPlan={defaultPlan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
