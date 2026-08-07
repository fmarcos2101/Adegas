import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHeroArt } from "@/components/marketing/landing-hero-art";
import { APP_NAME, TRIAL_DAYS } from "@/lib/constants";
import { getPlatformBilling } from "@/lib/platform-billing";
import { formatBRL } from "@/lib/utils";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const [billing, session] = await Promise.all([
    getPlatformBilling(),
    getSession(),
  ]);

  const appHome =
    session?.isPlatformAdmin && !session.tenantId
      ? "/plataforma"
      : session?.role === "CAIXA"
        ? "/pdv"
        : session
          ? "/dashboard"
          : null;

  return (
    <div className="min-h-screen bg-[var(--nexo-sand)] text-[var(--nexo-ink)]">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-display text-lg font-bold tracking-tight text-white">
          {APP_NAME}
        </span>
        <nav className="flex items-center gap-3 text-sm">
          {appHome ? (
            <Link
              href={appHome}
              className="rounded-md bg-white/10 px-3 py-2 font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              Ir ao painel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 font-medium text-teal-100/90 transition hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-md bg-teal-400 px-3 py-2 font-semibold text-slate-950 transition hover:bg-teal-300"
              >
                Começar grátis
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden">
        <LandingHeroArt />
        <div className="relative z-10 flex min-h-[100svh] items-end px-6 pb-16 pt-28 sm:items-center sm:px-10 sm:pb-24 lg:max-w-[52%]">
          <div className="max-w-xl">
            <p className="animate-nexo-fade font-display text-4xl font-bold tracking-tight text-teal-300 sm:text-5xl md:text-6xl">
              {APP_NAME}
            </p>
            <h1 className="animate-nexo-rise mt-4 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
              Seu PDV online, pronto para vender hoje.
            </h1>
            <p className="animate-nexo-rise-delay mt-5 max-w-md text-base leading-relaxed text-teal-50/85 sm:text-lg">
              Estoque, caixa e relatórios em um só lugar — comece com{" "}
              {TRIAL_DAYS} dias grátis, sem cartão na hora.
            </p>
            <div className="animate-nexo-rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-md bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
              >
                Criar minha loja
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md px-5 py-3 text-sm font-medium text-white/90 ring-1 ring-white/25 transition hover:bg-white/10"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--nexo-ink)]">
          Feito para o balcão
        </h2>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Leitor de código, atalhos de teclado e controle de estoque — o caixa
          vende rápido enquanto você acompanha o negócio.
        </p>
        <ul className="mt-12 grid gap-10 sm:grid-cols-3">
          {[
            {
              title: "PDV em tela cheia",
              body: "Busca por código ou nome, múltiplas formas de pagamento e finalização em segundos.",
            },
            {
              title: "Estoque sob controle",
              body: "Entradas, saídas e alertas de mínimo — sem planilha paralela.",
            },
            {
              title: "Assinatura simples",
              body: `Teste ${TRIAL_DAYS} dias. Depois escolha Básico ou Pro e cobre no Mercado Pago.`,
            },
          ].map((item) => (
            <li key={item.title}>
              <h3 className="font-display text-xl font-semibold text-[var(--nexo-teal)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="precos"
        className="border-y border-teal-900/10 bg-[var(--nexo-mist)] px-6 py-20 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Planos transparentes
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">
            Comece no trial. Faça upgrade quando o movimento pedir mais caixas.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <PricingBlock
              name="Trial"
              price="Grátis"
              detail={`${TRIAL_DAYS} dias · 1 PDV`}
              highlight={false}
            />
            <PricingBlock
              name="Básico"
              price={formatBRL(billing.basicPrice)}
              detail="por mês · 1 PDV"
              highlight
            />
            <PricingBlock
              name="Plus / Pro"
              price={formatBRL(billing.proPrice)}
              detail="por mês · até 3 PDVs"
              highlight={false}
            />
          </div>
          <div className="mt-10">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--nexo-teal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Começar teste grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span className="font-display font-semibold text-slate-700">
          {APP_NAME}
        </span>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-teal-800">
            Entrar
          </Link>
          <Link href="/cadastro" className="hover:text-teal-800">
            Cadastro
          </Link>
        </div>
      </footer>
    </div>
  );
}

function PricingBlock({
  name,
  price,
  detail,
  highlight,
}: {
  name: string;
  price: string;
  detail: string;
  highlight: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "border-l-2 border-[var(--nexo-teal)] pl-5"
          : "border-l-2 border-transparent pl-5"
      }
    >
      <p className="font-display text-sm font-semibold uppercase tracking-wider text-teal-800">
        {name}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight">
        {price}
      </p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}
