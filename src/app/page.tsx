import Link from "next/link";
import { LandingHeroArt } from "@/components/marketing/landing-hero-art";
import { LandingPlans } from "@/components/marketing/landing-plans";
import { SpecialistForm } from "@/components/marketing/specialist-form";
import { APP_NAME, TRIAL_DAYS } from "@/lib/constants";
import { getPlatformBilling } from "@/lib/platform-billing";
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

      <section className="relative overflow-hidden px-6 pb-14 pt-28 sm:px-10 sm:pb-20 sm:pt-32">
        <LandingHeroArt />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12">
          <div className="max-w-xl">
            <p className="animate-maf-fade font-display text-4xl font-bold tracking-[0.12em] sm:text-5xl">
              <span className="maf-chrome-text">{APP_NAME}</span>
            </p>
            <h1 className="animate-maf-rise mt-5 font-display text-3xl font-semibold leading-[1.12] tracking-tight text-zinc-900 sm:text-4xl">
              Seu PDV online, pronto para vender hoje.
            </h1>
            <p className="animate-maf-rise-delay mt-5 max-w-md text-base leading-relaxed text-zinc-600 sm:text-lg">
              Escolha o plano na hora — os dois começam com {TRIAL_DAYS} dias
              grátis, sem cartão.
            </p>
            <div className="animate-maf-rise-delay mt-8 flex flex-wrap items-center gap-4 text-sm">
              <Link
                href="/login"
                className="font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                Já tenho conta
              </Link>
              <a
                href="#especialistas"
                className="font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                Falar com especialistas
              </a>
            </div>
          </div>

          <LandingPlans
            basicPrice={billing.basicPrice}
            proPrice={billing.proPrice}
          />
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

      <footer className="mx-auto flex max-w-5xl flex-col gap-3 border-t border-zinc-200 px-6 py-10 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span className="inline-flex items-center gap-2 font-display font-semibold tracking-[0.14em] text-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-maf-icon.png" alt="" className="h-7 w-auto" />
          {APP_NAME}
        </span>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-zinc-900">
            Entrar
          </Link>
          <Link href="/cadastro" className="hover:text-zinc-900">
            Cadastro
          </Link>
          <a href="#precos" className="hover:text-zinc-900">
            Planos
          </a>
          <a href="#especialistas" className="hover:text-zinc-900">
            Especialistas
          </a>
        </div>
      </footer>
    </div>
  );
}
