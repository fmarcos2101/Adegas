import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { TRIAL_DAYS } from "@/lib/constants";
import { cn, formatBRL } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  period: string;
  badge?: string;
  highlight?: boolean;
  benefits: string[];
  href: string;
  cta: string;
};

export function LandingPlans({
  basicPrice,
  proPrice,
}: {
  basicPrice: number;
  proPrice: number;
}) {
  const plans: Plan[] = [
    {
      name: "Básico",
      price: formatBRL(basicPrice),
      period: "por mês",
      benefits: [
        "1 PDV (caixa ativo)",
        "Vendas com leitor e busca por nome",
        "Estoque com entradas e alertas",
        "Produtos, categorias e relatórios",
        `${TRIAL_DAYS} dias grátis para testar`,
      ],
      href: "/cadastro?plano=BASIC",
      cta: "Começar no Básico",
    },
    {
      name: "Pro",
      price: formatBRL(proPrice),
      period: "por mês",
      badge: "Mais caixas",
      highlight: true,
      benefits: [
        "Até 3 PDVs ao mesmo tempo",
        "Tudo do plano Básico",
        "Ideal para pico e turnos",
        "Mesma loja, vários operadores",
        `${TRIAL_DAYS} dias grátis para testar`,
      ],
      href: "/cadastro?plano=PRO",
      cta: "Começar no Pro",
    },
  ];

  return (
    <div
      id="precos"
      className="animate-maf-rise-delay-2 grid w-full gap-4 sm:grid-cols-2"
    >
      {plans.map((plan) => (
        <article
          key={plan.name}
          className={cn(
            "flex flex-col rounded-lg border bg-white/90 p-5 backdrop-blur-sm",
            plan.highlight
              ? "border-zinc-800 shadow-[0_16px_40px_rgba(15,15,20,0.12)]"
              : "border-zinc-200 shadow-sm",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {plan.name}
              </p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-900">
                {plan.price}
                <span className="ml-1 text-sm font-medium text-zinc-500">
                  {plan.period}
                </span>
              </p>
            </div>
            {plan.badge ? (
              <span className="maf-chrome-btn rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                {plan.badge}
              </span>
            ) : null}
          </div>

          <ul className="mt-5 flex-1 space-y-2.5">
            {plan.benefits.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm leading-snug text-zinc-700"
              >
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    plan.highlight ? "text-zinc-900" : "text-zinc-500",
                  )}
                  strokeWidth={2.25}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href={plan.href}
            className={cn(
              "mt-6 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition",
              plan.highlight
                ? "maf-chrome-btn"
                : "bg-zinc-900 text-white hover:bg-zinc-800",
            )}
          >
            {plan.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      ))}
    </div>
  );
}
