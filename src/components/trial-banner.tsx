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
          ? "flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          : "flex flex-wrap items-center justify-between gap-3 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950"
      }
    >
      <div className="flex items-start gap-2">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">
            Teste grátis — {daysLeft}{" "}
            {daysLeft === 1 ? "dia restante" : "dias restantes"}
          </p>
          <p className="text-xs opacity-80">
            Período de {TRIAL_DAYS} dias até {trialEndsAtLabel}. Depois é
            preciso assinar um plano.
          </p>
        </div>
      </div>
      <Link
        href="/assinatura"
        className={
          urgent
            ? "rounded-md bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
            : "rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600"
        }
      >
        Ver planos
      </Link>
    </div>
  );
}
