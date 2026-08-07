import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHeroArt } from "@/components/marketing/landing-hero-art";
import { SpecialistForm } from "@/components/marketing/specialist-form";
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
    <div className="min-h-screen bg-[var(--maf-surface)] text-[var(--maf-text)]">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="inline-flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-maf-icon.png"
            alt={APP_NAME}
            width={56}
            height={34}
            className="h-9 w-auto object-contain"
          />
          <span className="font-display text-sm font-bold tracking-[0.16em] text-zinc-900">
            {APP_NAME}
          </span>
        </span>
        <nav className="flex items-center gap-3 text-sm">
          {appHome ? (
            <Link
              href={appHome}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Ir ao painel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 font-medium text-zinc-600 transition hover:text-zinc-900"
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
            <p className="animate-maf-fade font-display text-4xl font-bold tracking-[0.12em] sm:text-5xl md:text-6xl">
              <span className="maf-chrome-text">{APP_NAME}</span>
            </p>
            <h1 className="animate-maf-rise mt-5 font-display text-3xl font-semibold leading-[1.12] tracking-tight text-zinc-900 sm:text-4xl md:text-[2.65rem]">
              Seu PDV online, pronto para vender hoje.
            </h1>
            <p className="animate-maf-rise-delay mt-5 max-w-md text-base leading-relaxed text-zinc-600 sm:text-lg">
              Estoque, caixa e relatórios em um só lugar — comece com{" "}
              {TRIAL_DAYS} dias grátis, sem cartão na hora.
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
                className="inline-flex items-center rounded-md px-5 py-3 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-white"
              >
                Já tenho conta
              </Link>
              <a
                href="#especialistas"
                className="inline-flex items-center rounded-md px-5 py-3 text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                Falar com especialistas
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="especialistas"
        className="border-y border-zinc-200 bg-white px-6 py-16 sm:px-10"
      >
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-zinc-900">
            Falar com especialistas
          </h2>
          <p className="mt-3 text-zinc-600">
            Prefere um atendimento humano antes de assinar? Preencha abaixo —
            nossa equipe entra em contato pelo WhatsApp.
          </p>
          <SpecialistForm />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-zinc-900">
          Feito para o balcão
        </h2>
        <p className="mt-3 max-w-2xl text-base text-zinc-600">
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
            <li key={item.title} className="border-l border-zinc-300 pl-4">
              <h3 className="font-display text-lg font-semibold text-zinc-800">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="precos"
        className="border-y border-zinc-200 bg-white px-6 py-20 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-zinc-900">
            Planos transparentes
          </h2>
          <p className="mt-3 max-w-xl text-zinc-600">
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
              className="maf-chrome-btn inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
            >
              Começar teste grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-5xl flex-col gap-3 border-t border-zinc-200 px-6 py-10 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span className="inline-flex items-center gap-2 font-display font-semibold tracking-[0.14em] text-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-maf.png" alt="" className="h-7 w-auto" />
          {APP_NAME}
        </span>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-zinc-900">
            Entrar
          </Link>
          <Link href="/cadastro" className="hover:text-zinc-900">
            Cadastro
          </Link>
          <a href="#especialistas" className="hover:text-zinc-900">
            Especialistas
          </a>
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
          ? "border-l-2 border-zinc-800 pl-5"
          : "border-l-2 border-zinc-200 pl-5"
      }
    >
      <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {name}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-900">
        {price}
      </p>
      <p className="mt-1 text-sm text-zinc-600">{detail}</p>
    </div>
  );
}
