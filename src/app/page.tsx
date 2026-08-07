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
    <div className="min-h-screen bg-[var(--maf-void)] text-[var(--maf-chrome-bright)]">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="inline-flex items-center gap-2">
          <img src="/logo-maf.svg" alt={APP_NAME} width={56} height={34} className="h-8 w-auto" />
          <span className="font-display text-sm font-bold tracking-[0.18em] text-white">
            {APP_NAME}
          </span>
        </span>
        <nav className="flex items-center gap-3 text-sm">
          {appHome ? (
            <Link
              href={appHome}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 font-medium text-white backdrop-blur transition hover:bg-white/10"
            >
              Ir ao painel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 font-medium text-zinc-300 transition hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="maf-chrome-btn rounded-md px-3 py-2 text-sm font-semibold"
              >
                Começar grátis
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden">
        <LandingHeroArt />
        <div className="relative z-10 flex min-h-[100svh] items-end px-6 pb-16 pt-28 sm:items-center sm:px-10 sm:pb-24 lg:max-w-[54%]">
          <div className="max-w-xl">
            <p className="animate-maf-fade font-display text-4xl font-bold tracking-[0.12em] text-white sm:text-5xl md:text-6xl">
              <span className="maf-chrome-text">{APP_NAME}</span>
            </p>
            <h1 className="animate-maf-rise mt-5 font-display text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-[2.65rem]">
              Precisão no caixa. Controle no negócio.
            </h1>
            <p className="animate-maf-rise-delay mt-5 max-w-md text-base leading-relaxed text-zinc-300 sm:text-lg">
              PDV online com estoque e assinatura — {TRIAL_DAYS} dias grátis para
              colocar a loja no ar.
            </p>
            <div className="animate-maf-rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/cadastro"
                className="maf-chrome-btn inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
              >
                Criar minha loja
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md px-5 py-3 text-sm font-medium text-zinc-200 ring-1 ring-white/20 transition hover:bg-white/5"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[var(--maf-ink)] px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
            Feito para o balcão
          </h2>
          <p className="mt-3 max-w-2xl text-base text-zinc-400">
            Leitor de código, atalhos de teclado e estoque em tempo real — o
            caixa vende; você acompanha.
          </p>
          <ul className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              {
                title: "PDV em tela cheia",
                body: "Busca por código ou nome, múltiplos pagamentos e finalização em segundos.",
              },
              {
                title: "Estoque sob controle",
                body: "Entradas, saídas e alertas de mínimo — sem planilha paralela.",
              },
              {
                title: "Assinatura simples",
                body: `Teste ${TRIAL_DAYS} dias. Depois Básico ou Pro com cobrança Mercado Pago.`,
              },
            ].map((item) => (
              <li key={item.title} className="border-l border-white/15 pl-4">
                <h3 className="font-display text-lg font-semibold text-[var(--maf-chrome)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="precos"
        className="border-t border-white/10 bg-[var(--maf-panel)] px-6 py-20 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
            Planos
          </h2>
          <p className="mt-3 max-w-xl text-zinc-400">
            Comece no trial. Escalone PDVs quando o movimento pedir.
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
              className="maf-chrome-btn inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
            >
              Começar teste grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-5xl flex-col gap-3 border-t border-white/10 px-6 py-10 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span className="font-display font-semibold tracking-[0.16em] text-zinc-300">
          {APP_NAME}
        </span>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-white">
            Entrar
          </Link>
          <Link href="/cadastro" className="hover:text-white">
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
          ? "border-l-2 border-[var(--maf-chrome)] pl-5"
          : "border-l-2 border-white/10 pl-5"
      }
    >
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        {name}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
        {price}
      </p>
      <p className="mt-1 text-sm text-zinc-400">{detail}</p>
    </div>
  );
}
