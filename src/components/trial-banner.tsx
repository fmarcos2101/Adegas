import Link from "next/link";
import { Clock } from "lucide-react";
import { TRIAL_DAYS } from "@/lib/constants";

export function TrialBanner({
  daysLeft,
  trialEndsAtLabel,
}: {
  daysLeft: number;
  trialEndsAtLabel: string;
}) {
  if (daysLeft <= 0) return null;

  const urgent = daysLeft <= 2;

  return (
    <div
      className={
        urgent
          ? "flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950"
          : "flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-800"
      }
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0" />
        <p>
          <strong>Teste grátis — {daysLeft} dia(s) restante(s).</strong>{" "}
          <span className="opacity-80">
            Período de {TRIAL_DAYS} dias até {trialEndsAtLabel}. Depois é
            preciso assinar.
          </span>
        </p>
      </div>
      <Link
        href="/assinatura"
        className="shrink-0 font-medium text-zinc-900 underline-offset-2 hover:underline"
      >
        Ver planos
      </Link>
    </div>
  );
}
