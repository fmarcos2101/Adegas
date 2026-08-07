import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  TRIALING: "bg-sky-950/60 text-sky-200 ring-sky-800/60",
  ACTIVE: "bg-emerald-950/50 text-emerald-200 ring-emerald-800/50",
  PAST_DUE: "bg-amber-950/50 text-amber-100 ring-amber-800/50",
  SUSPENDED: "bg-red-950/50 text-red-200 ring-red-900/50",
  CANCELLED: "bg-zinc-800/80 text-zinc-300 ring-zinc-700",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLE[status] ?? STATUS_STYLE.CANCELLED,
      )}
    >
      {label}
    </span>
  );
}
